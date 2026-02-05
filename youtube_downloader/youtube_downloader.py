#!/usr/bin/env python3
"""
YouTube Video Downloader Script
Uses yt-dlp to download videos from YouTube and other platforms.
Includes voice-based speaker diarization using pyannote.audio.
"""

import sys
import os
import json
import subprocess
import argparse
from pathlib import Path
from collections import defaultdict

# Load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import yt_dlp
except ImportError:
    print("Error: yt-dlp is not installed.")
    print("Please install it using: pip install yt-dlp")
    sys.exit(1)

# Check for pyannote.audio availability
PYANNOTE_AVAILABLE = False
try:
    from pyannote.audio import Pipeline
    import torch
    # Fix for PyTorch 2.6+ weights_only=True default
    # Allow safe globals needed by pyannote model checkpoints
    if hasattr(torch.serialization, 'add_safe_globals'):
        import torch.torch_version
        torch.serialization.add_safe_globals([torch.torch_version.TorchVersion])
    PYANNOTE_AVAILABLE = True
except ImportError:
    pass


def convert_audio_for_diarization(audio_path):
    """
    Convert audio to WAV format with 16kHz sample rate for pyannote compatibility.

    Args:
        audio_path (str): Path to the input audio file

    Returns:
        str: Path to the converted WAV file
    """
    base_name = os.path.splitext(audio_path)[0]
    wav_path = f"{base_name}_16k.wav"

    print(f"\nConverting audio to 16kHz WAV for diarization...")

    cmd = [
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-i', audio_path,
        '-ar', '16000',  # 16kHz sample rate
        '-ac', '1',       # Mono
        '-c:a', 'pcm_s16le',  # 16-bit PCM
        wav_path
    ]

    try:
        subprocess.run(cmd, check=True)
        print(f"Converted to: {wav_path}")
        return wav_path
    except subprocess.CalledProcessError as e:
        print(f"Error converting audio: {e}")
        return None
    except FileNotFoundError:
        print("Error: ffmpeg not found. Please install ffmpeg.")
        return None


def diarize_audio(audio_path, hf_token, num_speakers=None):
    """
    Perform speaker diarization using pyannote.audio.

    Uses neural speaker embeddings to identify speakers by voice characteristics,
    which works better than content-based diarization for atypical speech.

    Args:
        audio_path (str): Path to audio file
        hf_token (str): Hugging Face access token
        num_speakers (int): Optional hint for number of speakers

    Returns:
        list: List of segments [{'speaker': 'SPEAKER_00', 'start': 0.5, 'end': 2.3}, ...]
    """
    if not PYANNOTE_AVAILABLE:
        print("Error: pyannote.audio is not installed.")
        print("Install with: pip install pyannote.audio torch torchaudio")
        return None

    import torchaudio

    # Convert audio to compatible format
    wav_path = convert_audio_for_diarization(audio_path)
    if not wav_path:
        return None

    print("\nLoading pyannote speaker diarization model...")
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        token=hf_token
    )

    print("Running speaker diarization (this may take a while)...")

    # Pre-load audio with torchaudio to bypass torchcodec issues
    print("Loading audio file...")
    waveform, sample_rate = torchaudio.load(wav_path)
    audio_input = {"waveform": waveform, "sample_rate": sample_rate}

    # Run diarization with optional speaker count hint
    try:
        if num_speakers:
            diarization = pipeline(audio_input, num_speakers=num_speakers)
        else:
            diarization = pipeline(audio_input)
    finally:
        # Clean up temporary WAV file
        if os.path.exists(wav_path):
            os.remove(wav_path)

    # Extract segments - handle both old and new pyannote API
    segments = []

    # Check for pyannote 4.x API (DiarizeOutput with speaker_diarization attribute)
    if hasattr(diarization, 'speaker_diarization'):
        # New API (pyannote 4.x) - access speaker_diarization attribute
        for turn, speaker in diarization.speaker_diarization:
            segments.append({
                'speaker': f'SPEAKER_{speaker:02d}' if isinstance(speaker, int) else str(speaker),
                'start': turn.start,
                'end': turn.end
            })
    elif hasattr(diarization, 'itertracks'):
        # Old API (pyannote 3.x) - use itertracks method
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                'speaker': speaker,
                'start': turn.start,
                'end': turn.end
            })
    else:
        # Fallback - try to iterate directly
        print(f"Warning: Unknown diarization output type: {type(diarization)}")
        print(f"Attributes: {dir(diarization)}")

    print(f"Diarization complete! Found {len(segments)} segments")
    return segments


def format_timestamp_for_filename(seconds):
    """Convert seconds to MM-SS-mmm format for filenames."""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{minutes:02d}-{secs:02d}-{millis:03d}"


def format_timestamp(seconds):
    """Convert seconds to HH:MM:SS.mmm format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def save_diarization_result(segments, output_path, original_filename):
    """
    Save diarization result to JSON file.

    Args:
        segments (list): List of speaker segments
        output_path (str): Directory to save the output
        original_filename (str): Original audio filename

    Returns:
        str: Path to the saved JSON file
    """
    base_name = os.path.splitext(original_filename)[0]
    json_output_path = os.path.join(output_path, f"{base_name}_diarization.json")

    # Format segments for output
    formatted_segments = []
    for seg in segments:
        formatted_segments.append({
            'speaker': seg['speaker'],
            'start_time': seg['start'],
            'end_time': seg['end'],
            'start_time_formatted': format_timestamp(seg['start']),
            'end_time_formatted': format_timestamp(seg['end']),
            'duration': round(seg['end'] - seg['start'], 3)
        })

    # Get speaker statistics
    speaker_stats = defaultdict(lambda: {'count': 0, 'total_duration': 0})
    for seg in segments:
        speaker_stats[seg['speaker']]['count'] += 1
        speaker_stats[seg['speaker']]['total_duration'] += seg['end'] - seg['start']

    output_data = {
        'original_file': original_filename,
        'total_segments': len(segments),
        'speakers': dict(speaker_stats),
        'segments': formatted_segments
    }

    with open(json_output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\nDiarization saved to: {json_output_path}")

    # Print summary
    print("\n--- Speaker Summary ---")
    for speaker, stats in sorted(speaker_stats.items()):
        duration = stats['total_duration']
        print(f"{speaker}: {stats['count']} segments, {duration:.1f}s total")

    return json_output_path


def split_audio_by_speaker(audio_path, segments, output_dir):
    """
    Split audio into individual files per speaker segment using ffmpeg.

    Args:
        audio_path (str): Path to the audio file
        segments (list): List of speaker segments from diarization
        output_dir (str): Base directory for output

    Returns:
        str: Path to the splits directory
    """
    base_name = os.path.splitext(os.path.basename(audio_path))[0]
    splits_dir = os.path.join(output_dir, f"{base_name}_splits")

    # Group segments by speaker
    speaker_segments = defaultdict(list)
    for seg in segments:
        speaker_segments[seg['speaker']].append(seg)

    # Create speaker folders and split audio
    total_clips = 0
    for speaker in sorted(speaker_segments.keys()):
        # Create speaker folder (rename SPEAKER_XX to speaker_X for cleaner names)
        speaker_folder_name = speaker.lower().replace('speaker_', 'speaker_')
        speaker_dir = os.path.join(splits_dir, speaker_folder_name)
        Path(speaker_dir).mkdir(parents=True, exist_ok=True)

        segs = speaker_segments[speaker]
        print(f"\nSplitting {len(segs)} segments for {speaker}...")

        for i, seg in enumerate(segs, 1):
            start = seg['start']
            end = seg['end']
            duration = end - start

            # Skip very short segments (less than 0.1 seconds)
            if duration < 0.1:
                continue

            # Format: 001_00-31-299.mp3
            timestamp_str = format_timestamp_for_filename(start)
            output_filename = f"{i:03d}_{timestamp_str}.mp3"
            output_path = os.path.join(speaker_dir, output_filename)

            # Use ffmpeg to extract segment (re-encode to MP3)
            cmd = [
                'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
                '-i', audio_path,
                '-ss', str(start),
                '-to', str(end),
                '-c:a', 'libmp3lame',
                '-q:a', '2',
                output_path
            ]

            try:
                subprocess.run(cmd, check=True)
                total_clips += 1
            except subprocess.CalledProcessError as e:
                print(f"  Error splitting segment {i}: {e}")
            except FileNotFoundError:
                print("Error: ffmpeg not found. Please install ffmpeg.")
                return None

    print(f"\n--- Split Complete ---")
    print(f"Created {total_clips} audio clips in: {splits_dir}")

    return splits_dir


def download_video(url, output_path="downloads", quality="best"):
    """
    Download a video from YouTube or other supported platforms.

    Args:
        url (str): The URL of the video to download
        output_path (str): Directory where the video will be saved
        quality (str): Video quality - 'best', 'worst', or specific format

    Returns:
        str: Path to the downloaded file, or None if failed
    """
    # Create output directory if it doesn't exist
    Path(output_path).mkdir(parents=True, exist_ok=True)

    # Track the downloaded file path
    downloaded_file = [None]

    def track_filename(d):
        """Track the final downloaded filename."""
        if d['status'] == 'finished':
            downloaded_file[0] = d.get('info_dict', {}).get('_filename') or d.get('filename')

    # Configure download options
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'outtmpl': f'{output_path}/%(title)s.%(ext)s',
        'merge_output_format': 'mp4',
        'progress_hooks': [progress_hook, track_filename],
    }

    # Adjust format based on quality parameter
    if quality == "worst":
        ydl_opts['format'] = 'worstvideo+worstaudio/worst'
    elif quality == "audio":
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"\nDownloading: {url}")
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            print(f"Title: {title}")
            print(f"Duration: {info.get('duration', 0) // 60}:{info.get('duration', 0) % 60:02d}")
            print(f"Uploader: {info.get('uploader', 'Unknown')}\n")

            ydl.download([url])
            print("\nDownload completed successfully!")

            # Determine the actual output file path
            if quality == "audio":
                safe_title = ydl.prepare_filename(info)
                audio_file = os.path.splitext(safe_title)[0] + '.mp3'
                return audio_file
            else:
                return downloaded_file[0]

    except yt_dlp.utils.DownloadError as e:
        print(f"Error downloading video: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


def progress_hook(d):
    """Hook to display download progress."""
    if d['status'] == 'downloading':
        percent = d.get('_percent_str', 'N/A')
        speed = d.get('_speed_str', 'N/A')
        eta = d.get('_eta_str', 'N/A')
        print(f"\rProgress: {percent} | Speed: {speed} | ETA: {eta}", end='')
    elif d['status'] == 'finished':
        print(f"\nDownload finished, now converting...")


def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(
        description='YouTube Video Downloader with Voice-Based Speaker Diarization',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Download video
  python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID"

  # Download audio only
  python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads audio

  # Download audio with voice-based speaker diarization
  python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads audio --diarize

  # Diarize with speaker count hint (improves accuracy)
  python youtube_downloader.py "URL" downloads audio --diarize --num-speakers 2

  # Diarize and split into per-speaker folders
  python youtube_downloader.py "URL" downloads audio --diarize --split

Note: Speaker diarization requires a Hugging Face token with access to
      pyannote/speaker-diarization-3.1. Set HF_TOKEN environment variable
      or use --hf-token flag.
        '''
    )

    parser.add_argument('url', help='URL of the YouTube video')
    parser.add_argument('output_path', nargs='?', default='downloads',
                        help='Directory to save the video (default: downloads)')
    parser.add_argument('quality', nargs='?', default='best',
                        choices=['best', 'worst', 'audio'],
                        help="Quality: 'best', 'worst', or 'audio' (default: best)")
    parser.add_argument('--diarize', action='store_true',
                        help='Enable voice-based speaker diarization (audio only)')
    parser.add_argument('--split', action='store_true',
                        help='Split audio into per-speaker folders (requires --diarize)')
    parser.add_argument('--num-speakers', type=int, default=None,
                        help='Hint for number of speakers (improves accuracy)')
    parser.add_argument('--hf-token', type=str, default=None,
                        help='Hugging Face token (or set HF_TOKEN env var)')

    args = parser.parse_args()

    # Download the file
    downloaded_file = download_video(args.url, args.output_path, args.quality)

    # Run diarization if requested
    if args.diarize and args.quality == "audio" and downloaded_file and os.path.exists(downloaded_file):
        print("\n" + "="*50)
        print("Starting voice-based speaker diarization...")
        print("="*50)

        # Get HF token
        hf_token = args.hf_token or os.environ.get('HF_TOKEN')
        if not hf_token:
            print("Error: Hugging Face token required for diarization.")
            print("Set HF_TOKEN environment variable or use --hf-token flag.")
            print("Get your token at: https://huggingface.co/settings/tokens")
            sys.exit(1)

        if not PYANNOTE_AVAILABLE:
            print("Error: pyannote.audio is not installed.")
            print("Install with: pip install pyannote.audio torch torchaudio")
            sys.exit(1)

        # Run diarization
        segments = diarize_audio(downloaded_file, hf_token, args.num_speakers)

        if segments:
            # Save diarization result
            save_diarization_result(segments, args.output_path, os.path.basename(downloaded_file))

            # Split audio if requested
            if args.split:
                print("\n" + "="*50)
                print("Splitting audio by speaker...")
                print("="*50)
                split_audio_by_speaker(downloaded_file, segments, args.output_path)


if __name__ == "__main__":
    main()
