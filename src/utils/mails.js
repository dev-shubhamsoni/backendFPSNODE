const { runQuery } = require("./executeQuery")
const nodemailer = require('nodemailer');
const axios = require('axios');

const config = {
    method: 'post',
    url: 'https://api.zeptomail.in/v1.1/email/template',
    headers: {
      'accept': 'application/json',
      'authorization': 'Zoho-enczapikey PHtE6r0FFOzi2WcnpkUD7KXpR87yYYh7/ONkLQlOs4oTXvECSk0D/t0sxGDlrxwpVPlCQvOayIlqtLqasrrQIWrrNj1IXmqyqK3sx/VYSPOZsbq6x00VtFgZdkzeVo7ucdJj3CPeut/aNA==',
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    },
    // data: JSON.stringify(data)
  };
  


exports.applyJobMail = async (job, faculityUsers, status) => {
    
    // const job = await runQuery(`select * from jobs where jobID = ?`, [jobID])
    // const faculityUsers = await runQuery(`select * from faculity_users where faculityID = ?`, [facultyID])

    trackingUrl = process.env.FRONT_URL+"dashboard/applied-job?job="+job[0].slug
    
    experience = job[0].min_experience +"-"+job[0].max_experience +" "+job[0].experience_unit
    // Set up email data
    const data = {
        mail_template_key: "2518b.758a91b629e3107c.k1.d5a86080-52fd-11ef-b74e-525400674725.191217a8688",
        from: { address: "noreply@fpsjob.com", name: "Team Tallento" },
        to: [
          { email_address: { address: faculityUsers[0].email, name: faculityUsers[0].name } },
        ],
        merge_info: { 
            status: status, 
            job_title: job[0].job_title, 
            experience: experience, 
            city: job[0].city, 
            state: job[0].state,
            salary: job[0].salary_unit,
            tracking_url: trackingUrl
        }
      };
    config.data = JSON.stringify(data)

    axios(config)
    .then(response => {
        console.log(JSON.stringify(response.data));
    })
    .catch(error => {
        console.log('Error:', error.message);
    });
}
exports.employerApplyJobMail = async (job, faculityUsers) => {
    
  // Set up email data
    const data = {
        mail_template_key: "2518b.758a91b629e3107c.k1.8bc44480-910e-11ef-b4e4-52540003b539.192b83ac8c8",
        from: { address: "noreply@fpsjob.com", name: "Team Tallento" },
        to: [
          { email_address: { address: job[0].employer_email, name: faculityUsers[0].employer_name } }, 
        ],
        merge_info: { 
            job_title: job[0].job_title, 
            userName: faculityUsers[0].name,
            experience: faculityUsers[0].experience_label, 
            city: faculityUsers[0].city,
            state: faculityUsers[0].state,
            salary: faculityUsers[0].salary_label,
            tracking_url: process.env.EMPLOYER_URL
        }
      };
    config.data = JSON.stringify(data)

    axios(config)
    .then(response => {
        console.log(JSON.stringify(response.data));
    })
    .catch(error => {
        console.log('Error:', error.message);
    });
}
exports.employerApplyStatus = async (job, faculityUsers, status) => {
    
  // Set up email data
    const data = {
        mail_template_key: "2518b.758a91b629e3107c.k1.05749250-9ffe-11ef-855d-52540038fbba.1931a1c4ff5",
        from: { address: "noreply@fpsjob.com", name: "Team Tallento" },
        to: [
          { email_address: { address: faculityUsers.email, name: faculityUsers.name } }, 
        ],
        merge_info: { 
            status: status, 
            name: faculityUsers.name,
            JOB_TITLE: job.job_title, 
            tracking_url: process.env.EMPLOYER_URL
        }
      };
    config.data = JSON.stringify(data)

    axios(config)
    .then(response => {
        console.log(JSON.stringify(response.data));
    })
    .catch(error => {
        console.log('Error:', error.message);
    });
}
exports.forgetPasswordMail = async (faculityUsers, otp) => {
    
    // Set up email data
    const data = {
        mail_template_key: "2518b.758a91b629e3107c.k1.1f081610-0f62-11ef-a3ce-52540038fbba.18f6666b1f1",
        from: { address: "noreply@fpsjob.com", name: "Team Tallento" },
        to: [
          { email_address: { address: faculityUsers.email, name: faculityUsers.name } },
        ],
        merge_info: { 
          userName: faculityUsers.name, 
          otp: otp
        }
      };
    config.data = JSON.stringify(data)

    axios(config)
    .then(response => {
        console.log(JSON.stringify(response.data));
    })
    .catch(error => {
        console.log('Error:', error.message);
    });
}

exports.contactUsEmail = async (emailData, otp) => {
  
  // Set up email data
  const data = {
      mail_template_key: "2518b.758a91b629e3107c.k1.c8dc78f0-54c4-11ef-b31a-52540038fbba.1912d2015ff",
      from: { address: "info@fpsjob.com", name: "Team Tallento: Contact us" },
      to: [
        // { email_address: { address: "shivamsharma2096@gmail.com", name: "Team Tallento" } },
        { email_address: { address: "hr@fpsjobs.com", name: "Team Tallento" } },
      ],
      merge_info: { 
        userName: emailData.name, 
        email: emailData.email,
        message: emailData.message,
        number: emailData.mobile
      }
    };
  config.data = JSON.stringify(data)

  axios(config)
  .then(response => {
      console.log(JSON.stringify(response.data));
  })
  .catch(error => {
      console.log('Error:', error.message);
  });
}

exports.EmployerLeadFormSuccess = async (email, name) => {
  
  // Set up email data
  const data = {
      mail_template_key: "2518b.758a91b629e3107c.k1.09d269d0-a733-11ef-ab82-525400674725.1934957d0ed",
      from: { address: "info@fpsjob.com", name: "Team Tallento" },
      to: [
        // { email_address: { address: "shivamsharma2096@gmail.com", name: "Team Tallento" } },
        { email_address: { address: email, name: name } },
      ],
      merge_info: { 
        ClientName: name
      }
    };
  config.data = JSON.stringify(data)

  axios(config)
  .then(response => {
      console.log(JSON.stringify(response.data));
  })
  .catch(error => {
      console.log('Error:', error.message);
  });
}

exports.loginEmailOtp = async (email, name, otp) => {
  
  // Set up email data
  const data = {
      mail_template_key: "2518b.758a91b629e3107c.k1.088235f0-570c-11ef-86e5-525400ab18e6.1913c0e76cf",
      from: { address: "info@fpsjob.com", name: "Team Tallento" },
      to: [
        // { email_address: { address: "shivamsharma2096@gmail.com", name: "Team Tallento" } },
        { email_address: { address: email, name: name } },
      ],
      merge_info: { 
        OTP: otp
      }
    };
  config.data = JSON.stringify(data)

  axios(config)
  .then(response => {
      console.log(JSON.stringify(response.data));
  })
  .catch(error => {
      console.log('Error:', error.message);
  });
}
exports.sendOtpMail = async (otp,address, name) => {
  
  // Set up email data
  const data = {
      mail_template_key: "2518b.758a91b629e3107c.k1.c8dc78f0-54c4-11ef-b31a-52540038fbba.1912d2015ff",
      from: { address, name },
      to: [
        // { email_address: { address: "shivamsharma2096@gmail.com", name: "Team Tallento" } },
        { email_address: { address, name } },
      ],
      merge_info: { 
        otp
      }
    };
  config.data = JSON.stringify(data)

  axios(config)
  .then(response => {
      console.log(JSON.stringify(response.data));
  })
  .catch(error => {
      console.log('Error:', error.message);
  });
}

// exports.contactUsEmail = async (data) => {
    
//     subject = "Contact to " + data.name

//     // Set up email data
//     // const data = {
//     //     mail_template_key: "2518b.758a91b629e3107c.k1.c8dc78f0-54c4-11ef-b31a-52540038fbba.1912d2015ff",
//     //     from: { address: data.email, name: "Team Tallento" },
//     //     to: [
//     //       { email_address: { address: "hr@fpsjobs.com", name: "Team Tallento" } },
//     //     ],
//     //     merge_info: { 
//     //       userName: faculityUsers.name, 
//     //       otp: otp
//     //     }
//     //   };
//     // config.data = JSON.stringify(data)

//     // axios(config)
//     // .then(response => {
//     //     console.log(JSON.stringify(response.data));
//     // })
//     // .catch(error => {
//     //     console.log('Error:', error.message);
//     // });
// }


exports.verifyEmail = async (faculityUsers, EmailLink) => {
    
  // Set up email data
  const data = {
      mail_template_key: "2518b.758a91b629e3107c.k1.40a27570-594c-11ef-be3c-525400b0b0f3.1914acec647",
      from: { address: "noreply@fpsjob.com", name: "Team Tallento" },
      to: [
        { email_address: { address: faculityUsers.email, name: faculityUsers.name } },
        // { email_address: { address: "shivamsharma2096@gmail.com", name: faculityUsers.name } },
      ],
      merge_info: { 
        EmailLink: EmailLink, 
        userName: faculityUsers.name
      }
    };
  config.data = JSON.stringify(data)

  axios(config)
  .then(response => {
      console.log(JSON.stringify(response.data));
  })
  .catch(error => {
      console.log('Error:', error.message);
  });
}