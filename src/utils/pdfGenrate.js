const pdf = require("html-pdf-node");
const options = {
  format: "A4",
  margin: {
    top: "20px",
    right: "20px",
    bottom: "20px",
    left: "20px",
  },
};

exports.generatePDF = async (html) => {
  return await pdf.generatePdf({ content: html }, options);
};
