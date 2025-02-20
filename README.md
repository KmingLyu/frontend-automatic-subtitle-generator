[繁體中文說明](README_zh.md)

[website link](https://subgenerator.netlify.app/)

# Frontend Automatic Subtitle Generator

## Introduction

This is an online tool that automatically converts videos into subtitles (SRT format). Users can upload video files, and through OpenAI's Whisper speech recognition model, automatically generate corresponding subtitle files. This tool supports most common video formats and can handle large files (over 25MB).

## Features

- **Automatic Speech Recognition**: Utilize OpenAI's Whisper model to convert the speech content in videos into text.
- **Subtitle Generation**: Automatically generate SRT format subtitle files, convenient for use in various media players.
- **Large File Handling**: For files larger than 25MB, the program will automatically split the audio into 2-minute segments for processing.
- **Prompt Guidance**: Users can input prompt words to guide the model for more accurate speech recognition.
- **Traditional Chinese Conversion**: Automatically convert simplified Chinese characters in the recognition results into traditional Chinese characters, suitable for traditional Chinese users.
- **Multiple File Processing**: Supports uploading multiple video files simultaneously and processes them in sequence.
- **Progress Display**: Displays the processing progress and estimated cost of each file during processing.

## Usage Instructions

### Prerequisites

- **OpenAI API Key**: To use this tool, you need a valid OpenAI API Key. If you haven't applied yet, please visit the [OpenAI official website](https://platform.openai.com/account/api-keys) to obtain one.

### Steps

1. **Obtain the Program**

   - Download and unzip this project, ensuring it contains the following files:
     - `index.html`
     - `script.js`

2. **Open the Webpage**

   - Use a modern browser (such as Chrome, Firefox, Edge, etc.) to open `index.html`.

3. **Enter OpenAI API Key**

   - On the page, find the field labeled "Please enter your OpenAI API Key" and input your API Key.

4. **Enter Prompt (Optional)**

   - In the "Please enter prompt" field, you can input prompt words to guide the model and improve recognition accuracy. This step is optional.

5. **Upload Video Files**

   - Click the "Upload Video Files" button and select the video files you want to convert. You can select multiple files at once.

6. **Start Recognition**

   - After confirming that the API Key has been entered and video files have been selected, click the "Start Recognition" button.
   - The program will process each file in sequence, and you can see the processing progress and estimated cost on the page.

7. **Download Subtitle Files**

   - When processing is complete, the browser will automatically download the generated SRT subtitle files, with filenames matching the original video files but with the `.srt` extension.

8. **Play the Video**

   - Use a media player that supports SRT subtitles (such as VLC) to open the video. Place the downloaded subtitle file in the same folder as the video file (the subtitle file and video file should have the same name), and the subtitles will be displayed.

9. **Manually Edit Subtitles (Optional)**

   - If needed, you can manually edit the subtitle files to suit your requirements.
   - It is recommended to use professional subtitle editing software such as [Subtitle Edit](https://www.nikse.dk/subtitleedit) for editing.

## Notes

- **Cost Calculation**

  - Using the OpenAI API for speech recognition incurs costs, calculated at $0.006 per minute.
  - The program will pre-calculate the estimated cost of each video; please ensure your account has sufficient balance.

- **File Size Limit**

  - The maximum size for a single file is 25MB. For files larger than 25MB, the program will automatically split the audio into 2-minute segments for processing.

- **Privacy and Security**

  - Your API Key will only be used locally in your browser and will not be transmitted to any other servers.
  - The uploaded video files are only used for speech recognition and will not be stored or shared.

- **Browser Support**

  - It is recommended to use the latest version of modern browsers to ensure all features work properly.

## Technical Details

- **OpenAI Whisper Model**

  - Uses OpenAI's `whisper-1` model for speech recognition.
  - For API documentation, see [OpenAI API Reference](https://platform.openai.com/docs/api-reference/audio/createTranscription).

- **OpenCC Simplified-Traditional Conversion**

  - Utilizes the `OpenCC.js` library to convert simplified Chinese characters in the recognition results to traditional Chinese.
  - Open-source project link: [OpenCC](https://github.com/BYVoid/OpenCC).

- **Audio Processing**

  - For files larger than 25MB, uses the Web Audio API for audio decoding, splitting, and processing.
  - Converts `AudioBuffer` to WAV format for easy uploading to the OpenAI API.

- **Progress Management**

  - Uses JavaScript Promises and async/await to achieve synchronous processing and progress updates for multiple files.

## FAQ

### Q1: Why do I need an OpenAI API Key?

A1: This tool uses OpenAI's Whisper model for speech recognition. The API Key is used to verify your identity and calculate usage costs.

### Q2: How do I obtain an OpenAI API Key?

A2: Please visit the [OpenAI official website](https://platform.openai.com/account/api-keys), log in, and generate a new API Key in your account settings.

### Q3: What if processing large files is slow?

A3: Since large files need to be split and uploaded in segments for processing, the speed may be slower. Please be patient.

### Q4: Why are the recognition results incorrect or incomplete?

A4: The accuracy of speech recognition depends on factors such as audio quality and background noise. You can try providing prompts to improve accuracy.
