import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "iqbaltw127@gmail.com",
    pass: "xgvq mqcj hwju puqm",
  },
});

const sendVerifCode = async (email, code) => {
  const mailOptions = {
    from: "iqbaltw127@gmail.com",
    to: email,
    subject: "Kode Verifikasi Akun - Lintask.id",
    html: `
    <div style="font-family: Arial, sans-serif; background-color:#f5f7fa; padding: 40px; margin:0; color:#23355b;">
      <div style="max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <div style="background-color: #1986dd; padding: 25px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">
            Lintask.id
          </h2>
          <p style="color: #e8f4ff; margin-top: 5px; font-size: 14px;">
            Verifikasi Email Anda
          </p>
        </div>

        <!-- BODY -->
        <div style="padding: 30px;">
          <h3 style="color: #23355b; margin-top: 0;">Halo,</h3>

          <p style="font-size: 15px; color: #23355b;">
            Terima kasih telah melakukan registrasi akun di <b>Lintask.id</b>.  
            Berikut adalah kode verifikasi untuk mengaktifkan akun Anda:
          </p>

          <!-- CODE BOX -->
          <div style="
            margin: 25px 0;
            padding: 15px 20px;
            border-radius: 8px;
            background-color: #38bebb15;
            border: 1px solid #38bebb;
            text-align: center;
          ">
            <span style="font-size: 32px; font-weight: bold; color: #1986dd; letter-spacing: 4px;">
              ${code}
            </span>
          </div>

          <p style="font-size: 14px; color: #23355b;">
            Kode ini berlaku selama <b>5 menit</b>. Jangan berikan kode ini kepada siapa pun.
          </p>

          <p style="margin-top: 30px; font-size: 14px; color: #23355b;">
            Hormat kami,<br />
            <b>Tim Lintask.id</b>
          </p>
        </div>

        <!-- FOOTER -->
        <div style="background-color:#23355b; padding: 15px; text-align: center;">
          <p style="color:#ffffff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Lintask.id — Semua Hak Dilindungi
          </p>
        </div>

      </div>
    </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendResetPassword = async (email, id, token) => {
  const linkResetPass = `http://localhost:3000/reset-password/${id}/${token}`;

  const mailOptions = {
    from: "iqbaltw127@gmail.com",
    to: email,
    subject: "Reset Password Akun - Lintask.id",
    html: `
    <div style="font-family: Arial, sans-serif; background-color:#f5f7fa; padding: 40px; margin:0; color:#23355b;">
      <div style="max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <div style="background-color: #1986dd; padding: 25px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">
            Lintask.id
          </h2>
          <p style="color: #e8f4ff; margin-top: 5px; font-size: 14px;">
            Permintaan Reset Password
          </p>
        </div>

        <!-- BODY -->
        <div style="padding: 30px;">
          <h3 style="color: #23355b; margin-top: 0;">Halo,</h3>

          <p style="font-size: 15px; color: #23355b;">
            Anda menerima email ini karena kami mendapatkan permintaan untuk mereset password akun Anda di <b>Lintask.id</b>.
          </p>

          <p style="font-size: 15px; color: #23355b;">
            Klik tombol di bawah ini untuk melakukan reset password:
          </p>

          <!-- BUTTON -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${linkResetPass}" 
              style="
                background-color: #1986dd;
                padding: 14px 28px;
                color: #ffffff;
                border-radius: 6px;
                text-decoration: none;
                font-size: 16px;
                font-weight: bold;
                display: inline-block;
              ">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #23355b;">
            Jika tombol tidak berfungsi, Anda dapat membuka link berikut secara manual:
          </p>

          <p style="font-size: 14px; word-break: break-all; color:#1986dd;">
            ${linkResetPass}
          </p>

          <p style="font-size: 14px; color:#23355b;">
            Link ini hanya berlaku selama <b>10 menit</b>. Jika Anda tidak meminta reset password, abaikan email ini.
          </p>

          <p style="margin-top: 30px; font-size: 14px; color: #23355b;">
            Hormat kami,<br />
            <b>Tim Lintask.id</b>
          </p>
        </div>

        <!-- FOOTER -->
        <div style="background-color:#23355b; padding: 15px; text-align: center;">
          <p style="color:#ffffff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Lintask.id — Semua Hak Dilindungi
          </p>
        </div>

      </div>
    </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export { sendVerifCode, sendResetPassword };
