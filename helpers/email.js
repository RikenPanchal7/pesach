const nodemailer = require("nodemailer")
module.exports = {

    sendMail: async function (mainOptions) {
        var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            app: 'mail',
            auth:
            {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: { rejectUnauthorized: false }
            // host: 'smtp.mailgun.org',
            // port: 587,
            // secure: false,
            // // app: 'mail',
            // auth:
            // {
            //     user: process.env.EMAIL_USER,
            //     pass: process.env.EMAIL_PASS
            // },
            // tls: { rejectUnauthorized: false }
        });
        transporter.sendMail(mainOptions, function (err, info) {
            if (err) {
                console.log('----------', err);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

