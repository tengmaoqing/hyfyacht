/**
 * Created by 2nd on 15/10/4.
 */
var config = {
  staticMode: "express",
  cookieSecret: "eTCLgSutWMsZ3aGEELZT0XFfqWjfvvGQDG2iV200WFT3NOr3LNb6lW5HgkO5z6GqmnpsZGVEznVXKJogkfQH6wVpLfXDXgonwgrqAoByeexa2bJtHlcFM6C0TxUemR7t",
  sessionSecret: "x0pgTx2ws3W8Qf2os9JdcqGfksSNavWtXD8fdH1dv0xDW7DPvoaC6BCzIm8wLCDH0Phy5w6hweoIBqiH0TFpZG3EjI4WNZv0fxTggBKqUwINHH5MApCbKu1wPqguhzGs",
  cookieOption: {
    httpOnly: true,
    signed: true,
    maxAge: 30*24*60*60*1000
  },
  dbPath: "mongodb://localhost/hyfyacht"
};

module.exports = config;