
const { createFFmpeg } = FFmpeg;

// Helper function to convert a file to Uint8Array
const fetchFile = async (path) => {
    const response = await fetch(path);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};




const createVideoWithSingleKeyframe = async (imagePath, durationInSeconds, outputFilename) => {
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    // Read the image
    await ffmpeg.FS("writeFile", "input.png", await fetchFile(imagePath));

    // Set the duration and frame rate
    const frameRate = 30; // Adjust as needed
    const totalFrames = Math.round(durationInSeconds * frameRate);

    // Generate the video
    await ffmpeg.run(
        "-loop", "1",
        "-i", "input.png",
        "-t", durationInSeconds.toString(),
        "-r", frameRate.toString(),
        "-c:v", "libx264",
        "-x264-params", "keyint=1:min-keyint=1:no-scenecut",
        "-pix_fmt", "yuv420p",
        outputFilename
    );

    // Retrieve the video file
    const data = ffmpeg.FS("readFile", outputFilename);

    // Save the video to disk or perform further processing
    // e.g., create a Blob or download the file
    console.log(data);

    const url = URL.createObjectURL(data);

    document.body.innerHTML = `
              
              <video width="320" height="240" controls>
                  <source src="${url}" type="video/mp4">
                   Your browser does not support the video tag.
               </video>
              `;

    // Cleanup
    ffmpeg.exit();
};

// Call the function
const imagePath = "/image2video.png";
const durationInSeconds = 36000; // 10 hours
const outputFilename = "output.mp4"; // Adjust the output file name and format as needed

createVideoWithSingleKeyframe(imagePath, durationInSeconds, outputFilename)
    .then(() => {
        console.log("Video creation complete!");
        // Handle the generated video file here
    })
    .catch((error) => {
        console.error("Video creation failed:", error);
    });

