const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend service listening on port ${port}`);
});
