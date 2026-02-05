# YouTube Downloader

A Python script to download videos and audio from YouTube using yt-dlp, with voice-based speaker diarization using pyannote.audio. Includes a web-based editor for managing speaker segments.

## Features

- Download videos in best/worst quality
- Extract audio as MP3
- Voice-based speaker diarization (identifies speakers by voice characteristics)
- Split audio into per-speaker folders
- Works with atypical speech patterns (doesn't rely on speech content)
- **Web Application** for editing diarization results:
  - Play audio segments
  - Add transcriptions
  - Drag-drop to reassign segments to different speakers
  - Merge speakers
  - Export to JSON or text transcript

## Requirements

- Python 3.8+
- yt-dlp
- FFmpeg (for audio extraction and splitting)
- pyannote.audio >= 4.0 (for speaker diarization)
- Hugging Face account with access to pyannote models

## Installation

1. Clone the repository:

```bash
git clone https://github.com/dodohu918/youtube_downloader.git
cd youtube_downloader
```

2. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Install FFmpeg:

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

5. Set up Hugging Face token (for diarization):
   1. Create account at [huggingface.co](https://huggingface.co)
   2. Accept user conditions for these models:
      - [pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1)
      - [pyannote/segmentation-3.0](https://huggingface.co/pyannote/segmentation-3.0)
   3. Get your token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   4. Create a `.env` file in the project root:
      ```bash
      echo 'HF_TOKEN="hf_xxxx"' > .env
      ```

## Usage

```bash
python youtube_downloader.py <video_url> [output_path] [quality] [options]
```

### Arguments

| Argument         | Required | Default     | Description                                     |
| ---------------- | -------- | ----------- | ----------------------------------------------- |
| `video_url`      | Yes      | -           | URL of the YouTube video                        |
| `output_path`    | No       | `downloads` | Directory to save the file                      |
| `quality`        | No       | `best`      | Quality option: `best`, `worst`, or `audio`     |
| `--diarize`      | No       | -           | Enable voice-based speaker diarization          |
| `--split`        | No       | -           | Split audio into per-speaker folders            |
| `--num-speakers` | No       | auto        | Hint for number of speakers (improves accuracy) |
| `--hf-token`     | No       | -           | Hugging Face token (or use HF_TOKEN env var)    |

### Download Video (Best Quality)

```bash
python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Download Audio Only (MP3)

```bash
python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads audio
```

### Download Audio with Speaker Diarization

```bash
python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads audio --diarize
```

### Diarize with Speaker Count Hint

For better accuracy when you know the number of speakers:

```bash
python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads audio --diarize --num-speakers 2
```

### Diarize and Split by Speaker

Split the audio into separate folders per speaker:

```bash
python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads audio --diarize --split
```

## Output Structure

### Diarization Only

```
downloads/
  video_title.mp3
  video_title_diarization.json
```

### With --split Flag

```
downloads/
  video_title.mp3
  video_title_diarization.json
  video_title_splits/
    speaker_00/
      001_00-00-31.mp3
      002_00-01-45.mp3
      ...
    speaker_01/
      001_00-00-42.mp3
      002_00-02-10.mp3
      ...
```

## Diarization Output

The JSON file contains speaker segments with timestamps:

```json
{
  "original_file": "video_title.mp3",
  "total_segments": 25,
  "speakers": {
    "SPEAKER_00": { "count": 12, "total_duration": 45.5 },
    "SPEAKER_01": { "count": 13, "total_duration": 52.3 }
  },
  "segments": [
    {
      "speaker": "SPEAKER_00",
      "start_time": 0.5,
      "end_time": 5.23,
      "start_time_formatted": "00:00:00.500",
      "end_time_formatted": "00:00:05.230",
      "duration": 4.73
    },
    {
      "speaker": "SPEAKER_01",
      "start_time": 5.5,
      "end_time": 12.1,
      "start_time_formatted": "00:00:05.500",
      "end_time_formatted": "00:00:12.100",
      "duration": 6.6
    }
  ]
}
```

## Examples

```bash
# Download video in best quality
python youtube_downloader.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Download video in lowest quality
python youtube_downloader.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" downloads worst

# Download audio only
python youtube_downloader.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" downloads audio

# Download audio with speaker diarization
python youtube_downloader.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" downloads audio --diarize

# Diarize with 2-speaker hint (for interviews)
python youtube_downloader.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" downloads audio --diarize --num-speakers 2

# Diarize and split into speaker folders
python youtube_downloader.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" downloads audio --diarize --split
```

## Web Application

The web application provides a visual editor for managing diarization results.

### Running Locally

1. Install backend dependencies:

```bash
pip install -r requirements.txt
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Start both backend and frontend:

```bash
# Option 1: Use the run script
./run.sh

# Option 2: Start separately
# Terminal 1 - Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

4. Open http://localhost:5173 in your browser

### Running with Docker

The easiest way to run the application with consistent environments:

#### Prerequisites

- Docker and Docker Compose installed
- `.env` file with your `HF_TOKEN`

#### Quick Start

```bash
# Build and start both services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

Access the app at http://localhost:5173

#### Docker Commands

```bash
# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build

# Remove volumes (clears data)
docker-compose down -v
```

#### Running on AWS with Docker

On your EC2 instance:

```bash
# Install Docker (Ubuntu/Debian)
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# Log out and back in for group changes

# Clone and run
git clone https://github.com/dodohu918/youtube_downloader.git
cd youtube_downloader
echo 'HF_TOKEN="hf_xxxx"' > .env
docker-compose up --build -d
```

Then set up SSM port forwarding from your local machine (see below).

### Running on AWS (via SSM)

To run the application on an AWS EC2 instance and access it from your local machine via SSM port forwarding:

#### 1. Set up the EC2 instance

SSH or SSM into your instance and clone/setup the project:

```bash
# Clone the repo
git clone https://github.com/dodohu918/youtube_downloader.git
cd youtube_downloader

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..

# Create .env file with your HF token
echo 'HF_TOKEN="hf_xxxx"' > .env
```

#### 2. Start the backend and frontend on AWS

```bash
# Terminal 1 - Backend (bind to 0.0.0.0 to allow connections)
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend (use --host to expose)
cd frontend
npm run dev -- --host
```

#### 3. Set up SSM port forwarding from your local machine

On your local machine, forward both ports:

```bash
# Terminal 1 - Forward backend (port 8000)
aws ssm start-session --target i-055eee12bd5a3aa22 \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["8000"],"localPortNumber":["8000"]}'

# Terminal 2 - Forward frontend (port 5173)
aws ssm start-session --target i-055eee12bd5a3aa22 \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["5173"],"localPortNumber":["5173"]}'
```

#### 4. Access the application

Open http://localhost:5173 in your local browser.

#### Finding your EC2 Instance ID

```bash
aws ec2 describe-instances \
    --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0],State.Name]' \
    --output table
```

#### Performance Notes

- **GPU recommended**: Speaker diarization is computationally intensive. Using a GPU instance (p3, g4dn, g5) significantly speeds up processing.
- **CPU performance**: On CPU-only instances, a 10-minute audio file may take 5-15+ minutes to process.
- Check GPU availability: `python -c "import torch; print('CUDA:', torch.cuda.is_available())"`

### Web App Features

- **Landing Page**: Enter a YouTube URL to start diarization
- **Project List**: View and manage your diarization projects
- **Editor Page**:
  - Speaker cards showing all segments per speaker
  - Audio playback for each segment
  - Transcription input fields
  - Drag-drop segments between speakers to reassign
  - Merge speakers together
  - Export as JSON or text transcript

## Why Voice-Based Diarization?

This tool uses pyannote.audio for speaker diarization, which identifies speakers by their voice characteristics (timbre, tone, acoustic features) rather than speech content. This approach:

- Works reliably with atypical speech patterns
- Doesn't depend on understanding what is being said
- Uses neural speaker embeddings for accurate identification
- Handles overlapping speech and varying audio quality

## License

MIT License
