const mysql = require("mysql");
const conn = {
	host: "localhost",
	user: "micro",
	password: "service",
	database: "monolithic"
};

var connection = mysql.createConnection(conn);
connection.connect();
connection.query("query", (error, result, fields) => {
	// 결과 처리
});
connection.end();
