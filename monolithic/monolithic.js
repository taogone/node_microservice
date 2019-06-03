const http = require("http");
const url = require("url");
const querystring = require("querystring");
const members = require("./monolithic_members.js");
const goods = require("./monolithic_goods.js");
const purchase = require("./monolithic_purchases.js");

// HTTP 서버 생성 및 응답 처리
var server = http
	.createServer((req, res) => {
		var method = req.method;
		var uri = url.parse(req.url, true);
		var pathname = uri.pathname;

		// POST나 PUT이면 데이터를 읽음
		if (method === "POST" || method === "PUT") {
			var body = "";
			req.on("data", function(data) {
				body += data;
			});
			req.on("end", function() {
				var params;
				// Header 정보가 JSON이면 처리
				if (req.headers["content-type"] == "application/json") {
					params = JSON.parse(body);
				} else {
					params = querystring.parse(body);
				}
				onRequest(res, method, pathname, uri.query);
			});
		} else {
			// GET 또는 DELETE이면 query 정보를 읽음
			onRequest(res, method, pathname, uri.query);
		}
	})
	.listen(8000);

// 요청에 대해 회원관리, 상품관리, 구매관리 모듈별로 분기
// @param res       response 객체
// @param method    메서드
// @param pathname  URI
// @param params    입력 파라미터

function onRequest(res, method, pathname, params) {
	switch (pathname) {
		case "/members":
			members.onRequest(res, method, pathname, params, response);
			break;
		case "/goods":
			goods.onRequest(res, method, pathname, params, response);
			break;
		case "/purchase":
			purchase.onRequest(res, method, pathname, params, response);
			break;
		default:
			res.writeHead(404);
			return res.end();
	}
}

// HTTP 헤더에 JSON 형식으로 응답
// @param res       response 객체
// @param packet    결과 파라미터
function response(res, packet) {
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify(packet));
}
