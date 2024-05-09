const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const fs = require('fs');

const { renderMedia, selectComposition, getCompositions } = require("@remotion/renderer");

app.use(cors());
app.use(express.json());

const imagesMap = {};
let allImages = []

const SERVE_URL = `https://remotionlambda-useast1-b3quqlxdff.s3.us-east-1.amazonaws.com/sites/pic-to-vid/index.html`;

const startVideoDownload = async (inputProp) => {

  console.log(inputProp, " input proip | all images")
  const comp = await getCompositions(
    SERVE_URL,
  );
  console.log(comp, " compisiton recieved ");

  // const imagesArr = Object.values(imagesMap);
  // console.log(imagesArr, ' images array');

  const composition = await selectComposition({
    serveUrl: SERVE_URL,
    id: 'Empty',
    inputProps: inputProp,
  });

  console.log(composition, "compositon selected")
  const renderResult = await renderMedia({
    composition: composition,
    serveUrl: SERVE_URL,
    codec: "h264",
    outputLocation: './output.mp4',
    inputProps: inputProp,
  });

  console.log(renderResult, " result of render function")

  allImages = []

  if (renderResult) {
    return true;
  }
  else
    return false
}
app.post("/upload", async (req, res) => {
  console.log("inside upload fuction");
  const { imageArr } = req.body;
  // iterate over each image and put it in map 

  for (let image of imageArr) {
    // console.log(image, " image");
    allImages.push(image);
  }

  const inputProp = {
    imageBlobs: allImages,
    text: "this is a new text"
  }
  const videoSave = await startVideoDownload(inputProp)

  if (videoSave) {
    const filePath = path.join(__dirname, 'output.mp4');

    console.log(filePath, " filepath")
    // Check if the file exists
    fs.stat(filePath, (err, stats) => {
      if (err) {
        console.error(err);
        return res.status(404).send('File not found');
      }

      // Set the appropriate headers for streaming the video
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Type', 'video/mp4');

      // Create a read stream from the file and pipe it to the response
      // res.status(200).json({msg : 'File Render Successful'});
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    });
  }
  else {
    return res.status(400).json({ msg: 'Video Render Failed', data: null })
  }
})

app.post("/render", async (req, res) => {
  console.log("inside render");

  // const comp = await getCompositions(
  //   'https://remotionlambda-useast1-b3quqlxdff.s3.us-east-1.amazonaws.com/sites/pic-to-vid/index.html',
  // );
  // console.log(comp, " compisiton recieved ");

  const composition = await selectComposition({
    serveUrl: 'https://remotionlambda-useast1-b3quqlxdff.s3.us-east-1.amazonaws.com/sites/pic-to-vid/index.html',
    id: 'Empty',
    inputProps,
  });

  console.log("compositon selected", composition)
  // const renderResut = await renderMedia({
  //   composition : '',
  //   serveUrl :  'https://remotionlambda-useast1-b3quqlxdff.s3.us-east-1.amazonaws.com/sites/pic-to-vid/index.html',
  //   codec: "h264",
  //   outputLocation : './output.mp4',
  //   inputProps : Object.values(imagesMap),
  // });

  // console.log(renderResut , " result of render function")

})
app.get("/", (req, res) => {
  res.send("All good man")
})

const PORT = 4000;
app.listen(PORT, (err) => {
  if (err) {
    console.log("Error in Server");
    return;
  }
  console.log(`Server started on http://localhost:${PORT}`)

})