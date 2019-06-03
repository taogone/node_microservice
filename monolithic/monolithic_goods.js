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
		errorcode: 0,
		errormessage: "sucess"
	};
	if (
		params.name == null ||
		params.category == null ||
		params.price == null ||
		params.description == null
	) {
		response.errorcode = 1;
		response.errormessage = "invalid parameters";
		cb(response);
	} else {
		var connection = mysql.createConnection(conn);
		connection.connect();
		connection.query(
			"insert into goods(name, category, price, description') values(?,?,?,?)",
			[params.name, params.category, params.price, params.description],
			(error, results, fileds) => {
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
		errorcode: 0,
		errormessage: "success"
	};
	var connection = mysql.createConnection(conn);
	connection.connect();
	connection.query("select * from goods", (error, results, fields) => {
		if (error || results.length == 0) {
			response.errorcode = 1;
			response.errormessage = error ? error : "no data";
		} else {
			response.results = results;
		}
		cb(response);
	});
	connection.end();
}

function unregister(method, pathname, params, cb) {
	var response = {
		errorcode: 0,
		errormessage: "success"
	};
	if (params.id == null) {
		response.errorcode = 1;
		response.errormessage = "invalid parameters";
		cb(response);
	} else {
		var connection = mysql.createConnection(conn);
		connection.connect();
		connection.query(
			"delete from goods where id = ?",
			[params.id],
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
