const mysql = require("mysql");
const conn = {
	host: "localhost",
	user: "micro",
	password: "service",
	database: "monolithic"
};

exports.onRequest = function(res, method, pathname, params, cb) {
	// 메서드 별로 기능 분기
	switch (method) {
		case "POST":
			return register(method, pathname, params, response => {
				process.nextTick(cb, res, response);
			});
		case "GET":
			return inquiry(method, pathname, params, response => {
				process.nextTick(cb, res, response);
			});
		case "DELETE":
			return unregister(method, pathname, params, response => {
				process.nextTick(cb, res, response);
			});
		default:
			return process.nextTick(cb, res, null); // 정의되지 않은 메서드인 경우 null을 return
	}
};

function register(method, pathname, params, cb) {
	var response = {
		key: params.key,
		errorcode: 0,
		errormessage: "success"
	};

	if (params.username == null || params.password == null) {
		response.errorcode = 1;
		response.errormessage = "invalid parameters";
		cb(response);
	} else {
		var connection = mysql.createConnection(conn);
		connection.connect();
		connection.query(
			"insert into members(username, password) values('" +
				params.username +
				"',password('" +
				params.password +
				"'));",
			(error, results, fields) => {
				if (error) {
					response.errorcode = 1;
					response.errormessage = error;
				}
				cb(response);
			}
		);
		connection.end();
	}
}

function inquiry(method, pathname, params, cb) {
	var response = {
		key: params.key,
		errorcode: 0,
		errormessage: "success"
	};
	if (params.username == null || params.password == null) {
		response.errorcode = 1;
		response.errormessage = "invalid parameters";
		cb(response);
	} else {
		var connection = mysql.createConnection(conn);
		connection.connect();
		connection.query(
			"select id from members where username = '" +
				params.username +
				"' and password = password('" +
				params.password +
				"'));",
			(error, results, fields) => {
				if (error) {
					response.errorcode = 1;
					response.errormessage = error ? error : "invalid password";
				} else {
					response.userid = results[0].id;
				}
				cb(response);
			}
		);
		connection.end();
	}
}

function unregister(method, pathname, params, cb) {
	var response = {
		key: params.key,
		errorcode: 0,
		errormessage: "success"
	};
	if (params.username == null) {
		response.errorcode = 1;
		response.errormessage = "invalid parameters";
		cb(response);
	} else {
		var connection = mysql.createConnection(conn);
		connection.connect();
		connection.query(
			"delete from members where username = '" + params.username + "';",
			(error, results, fields) => {
				if (error) {
					response.errorcode = 1;
					response.errormessage = error;
				}
				cb(response);
			}
		);
		connection.end();
	}
}
