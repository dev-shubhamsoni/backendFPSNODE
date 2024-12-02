const { sendError, sendSuccess } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { sendMailWithAttachment } = require("../../utils/mailHandler");
const { generatePDF } = require("../../utils/pdfGenrate");
const { isBase64, isValidEmail } = require("../../utils/validator");

exports.letterTemplateAdd = async (req, res) => {
  try {
    const { inst_id, title, description } = req.body;
    if (!title) {
      return sendError(res, { message: "Please enter title..." });
    } else if (!description) {
      return sendError(res, { message: "Please enter description..." });
    }
    const query = `INSERT INTO letter_template (title,description,created_by,type) VALUES(?, ?, ?, ?)`;
    await runQuery(query, [title, description, inst_id, "Employee"]);
    return sendSuccess(res, {
      data: [],
      message: `Letter Template Added sucessfully ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterTemplateEdit = async (req, res) => {
  try {
    const { templateID } = req.params;
    const { title, description } = req.body;
    if (!title) {
      return sendError(res, { message: "Please enter title..." });
    } else if (!description) {
      return sendError(res, { message: "Please enter description..." });
    }
    const query = `UPDATE letter_template SET title = ?, description = ? WHERE id = ?`;
    await runQuery(query, [title, description, templateID]);
    return sendSuccess(res, {
      data: [],
      message: `Letter Template updated sucessfully ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterTemplateGet = async (req, res) => {
  try {
    const { inst_id } = req.body;
    const { status } = req.query;
    let values = [inst_id];
    let query = `SELECT * FROM letter_template WHERE created_by = ?`;
    if (status) {
      query += ` AND status = ?`;
      values.push(Number(status || 0));
    }
    const data = await runQuery(query, values);
    return sendSuccess(res, {
      data: data,
      message: `Letter Template list ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.letterTemplateGetById = async (req, res) => {
  try {
    const { inst_id } = req.body;
    const { templateID } = req.params;
    let values = [inst_id, templateID];
    let query = `SELECT * FROM letter_template WHERE created_by = ? and id = ?`;
    const data = await runQuery(query, values);
    return sendSuccess(res, {
      data: data,
      message: `Letter Template detail ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterTemplateStatusUpdate = async (req, res) => {
  try {
    const { templateID, status } = req.params;
    let nStatus = status === "true" ? 1 : 0;
    const query = `UPDATE letter_template SET status = ? WHERE id = ?`;
    await runQuery(query, [nStatus, templateID]);
    return sendSuccess(res, {
      data: [],
      message: `status updated sucessfully ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterAdd = async (req, res) => {
  try {
    const {
      inst_id,
      templateID,
      faculityID,
      faculity_name,
      description,
      send_mail = false,
      email_id,
      subject,
      body_content,
    } = req.body;
    if (!templateID) {
      return sendError(res, { message: "Please enter templateID..." });
    } else if (!faculity_name) {
      return sendError(res, { message: "Please enter faculity_name..." });
    } else if (!description) {
      return sendError(res, { message: "Please enter description..." });
    } else if (!(send_mail === true || send_mail === false)) {
      return sendError(res, { message: "send_mail must be true or false..." });
    } else if (send_mail) {
      if (!(send_mail === true || send_mail === false)) {
        return sendError(res, { message: "send_mail must be true or false..." });
      } else if (!email_id) {
        return sendError(res, { message: "Please enter Email Id..." });
      } else if (!isValidEmail(email_id)) {
        return sendError(res, { message: "Please enter a valid email id..." });
      } else if (!subject) {
        return sendError(res, { message: "Please enter Subject..." });
      } else if (!body_content) {
        return sendError(res, { message: "Please enter Subject..." });
      }
    }
    const query = `INSERT INTO letters (templateID,faculityID,faculity_name,description,employerID) VALUES(?, ?, ?, ?, ?)`;
    const letterData = await runQuery(query, [templateID, faculityID, faculity_name, description, inst_id]);
    if (send_mail) {
      const templateData = await runQuery("SELECT title FROM letter_template where id = ?", [templateID]);
      const filename = `${templateData[0]?.title?.trim()?.toLowerCase()?.replace(/\s+/g, "_") || Date.now()}.pdf`;
      const pdfBuffer = await generatePDF(description);
      await sendMailWithAttachment(email_id, subject, body_content, [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ]);
    }
    console.log(letterData)
    return sendSuccess(res, {
      data: [{id:letterData?.insertId}],
      message: `Letter Added sucessfully ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterSendMail = async (req, res) => {
  try {
    const { inst_id, letter_id, email_id, subject, body_content } = req.body;
    if (!email_id) {
      return sendError(res, { message: "Please enter Email Id..." });
    } else if (!isValidEmail(email_id)) {
      return sendError(res, { message: "Please enter a valid email id..." });
    } else if (!subject) {
      return sendError(res, { message: "Please enter Subject..." });
    } else if (!body_content) {
      return sendError(res, { message: "Please enter body content..." });
    } else if (!letter_id) {
      return sendError(res, { message: "Please enter letter_id..." });
    }
    const letterData = await runQuery(
      "select letters.description, letter_template.title  from letters left join letter_template ON letters.templateID = letter_template.id where letters.id = ?",
      [letter_id]
    );
    if (letterData?.length == 0) {
      return sendError(res, { message: "Please enter valid letter_id..." });
    }
    const filename = `${letterData[0]?.title?.trim()?.toLowerCase()?.replace(/\s+/g, "_") || Date.now()}.pdf`;
    const pdfBuffer = await generatePDF(letterData[0]?.description);
    await sendMailWithAttachment(email_id, subject, body_content, [
      {
        filename: filename,
        content: pdfBuffer,
      },
    ]);
    return sendSuccess(res, {
      data: [],
      message: `Mail Send successfully sucessfully ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterEdit = async (req, res) => {
  try {
    const { letterID } = req.params;
    const {
      inst_id,
      templateID,
      faculityID,
      faculity_name,
      description,
      send_mail = false,
      email_id,
      subject,
      body_content,
    } = req.body;
    if (!templateID) {
      return sendError(res, { message: "Please enter templateID..." });
    } else if (!faculity_name) {
      return sendError(res, { message: "Please enter faculity_name..." });
    } else if (!description) {
      return sendError(res, { message: "Please enter description..." });
    } else if (send_mail) {
      if (!(send_mail === true || send_mail === false)) {
        return sendError(res, { message: "send_mail must be true or false..." });
      } else if (!email_id) {
        return sendError(res, { message: "Please enter Email Id..." });
      } else if (!isValidEmail(email_id)) {
        return sendError(res, { message: "Please enter a valid email id..." });
      } else if (!subject) {
        return sendError(res, { message: "Please enter Subject..." });
      } else if (!body_content) {
        return sendError(res, { message: "Please enter Subject..." });
      }
    }
    const data = await runQuery(`SELECT * FROM letters WHERE id = ?`, letterID);
    if (data?.length == 0) {
      return sendError(res, { status: 404, message: "Record Not Found" });
    }
    const query = `UPDATE letters SET templateID = ?, faculityID = ? , faculity_name = ?, description = ? WHERE id = ?`;
    await runQuery(query, [templateID, faculityID, faculity_name, description, letterID]);
    if (send_mail) {
      const templateData = await runQuery("SELECT title FROM letter_template where id = ?", [templateID]);
      const filename = `${templateData[0]?.title?.trim()?.toLowerCase()?.replace(/\s+/g, "_") || Date.now()}.pdf`;
      const pdfBuffer = await generatePDF(description);
      await sendMailWithAttachment(email_id, subject, body_content, [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ]);
    }
    return sendSuccess(res, {
      data: [],
      message: `Letter updated sucessfully ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterGet = async (req, res) => {
  try {
    const { inst_id } = req.body;
    const { status } = req.query;
    let values = [inst_id];
    let query = `SELECT * FROM letters WHERE employerID = ?`;
    if (status) {
      query += ` AND status = ?`;
      values.push(Number(status || 0));
    }
    const data = await runQuery(query, values);
    return sendSuccess(res, {
      data: data,
      message: `Letter list ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.letterGetById = async (req, res) => {
  try {
    const { inst_id } = req.body;
    const { letterID } = req.params;
    let values = [inst_id, letterID];
    let query = `SELECT * FROM letters WHERE employerID = ? and id = ?`;
    const data = await runQuery(query, values);
    if (data?.length == 0) {
      return sendError(res, { status: 404, message: "Record Not Found" });
    }
    return sendSuccess(res, {
      data: data[0],
      message: `Letter detail ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.letterStatusUpdate = async (req, res) => {
  try {
    const { letterID, status } = req.params;
    let nStatus = status === "true" ? 1 : 0;
    const data = await runQuery(`SELECT * FROM letters WHERE id = ?`, letterID);
    if (data?.length == 0) {
      return sendError(res, { status: 404, message: "Record Not Found" });
    }
    const query = `UPDATE letters SET status = ? WHERE id = ?`;
    await runQuery(query, [nStatus, letterID]);
    return sendSuccess(res, {
      data: [],
      message: `status updated sucessfully ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
