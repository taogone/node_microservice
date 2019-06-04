"use strict";
const http = require("http");
const url = require("url");
const querystring = require("querystring");
const tcpClient = require("./client");

var mapClients = {};
var mapUrls = {};
var mapResponse = {};
var mapRR = {};
var index = 0;

var server = http
	.createServer((req, res) => {
		var method = req.method;
		var uri = url.parse(req.url, true);
		var pathname = uri.pathname;

		if (method === "POST" || method === "PUT") {
			var body = "";
			req.on("data", function(data) {
				body += data;
			});
			req.on("end", function() {
				var params;
				// 헤더가 application/json일 경우 JSON으로 파싱
				if (req.headers["content-type"] == "application/json") {
					params = JSON.parse(body);
				} else {
					// 헤더가 JSON이 아닌 경우 querystring으로 파싱
					params = querystring.parse(body);
				}
				onRequest(res, method, pathname, params);
			});
		} else {
			onRequest(res, method, pathname, uri.query);
		}
	})
	.listen(8000, () => {
		console.log("listen", server.address());

		// Distributor 전달 패킷
		var packet = {
			uri: "/distributes",
			method: "POST",
			key: 0,
			params: {
				port: 8000,
				name: "gate",
				urls: []
			}
		};
		var isConnectedDistributor = false;

		// Distributor 접속
		this.clientDistributor = new tcpClient(
			"127.0.0.1",
			9000,
			options => {
				isConnectedDistributor = true;
				this.clientDistributor.write(packet);
			},
			(options, data) => {
				onDistribute(data);
			},
			options => {
				isConnectedDistributor = false;
			},
			options => {
				isConnectedDistributor = false;
			}
		);

		setInterval(() => {
			if (isConnectedDistributor != true) {
				this.clientDistributor.connect();
			}
		}, 3000);
	});

// API 호출 처리
function onRequest(res, method, pathname, params) {
	var key = method + pathname;
	var client = mapUrls[key];
	if (client == null) {
		// 처리 가능한 API만 처리
		res.writeHead(404);
		res.end();
		return;
	} else {
		params.key = index; // API호출에 대한 고유 키 발급
		var packet = {
			uri: pathname,
			method: method,
			params: params
		};

		mapResponse[index] = res; // 요청에 대한 응답 객체 저장
		index++; // 고유 값 증가
		if (
			mapRR[key] == null // 라운드 로빈 처리
		)
			mapRR[key] = 0;
		mapRR[key]++;
		client[mapRR[key] % client.length].write(packet);
	}
}

// Distributor 접속 처리
function onDistribute(data) {
	for (var n in data.params) {
		var node = data.params[n];
		var key = node.host + ":" + node.port;
		if (mapClients[key] == null && node.name != "gate") {
			var client = new tcpClient(
				node.host,
				node.port,
				onCreateClient,
				onReadClient,
				onEndClient,
				onErrorClient
			);
			mapClients[key] = {
				client: client,
				info: node
			};
			for (var m in node.urls) {
				var key = node.urls[m];
				if (mapUrls[key] == null) {
					mapUrls[key] = [];
				}
				mapUrls[key].push(client);
			}
			client.connect();
		}
	}
}

function onCreateClient(options) {
	console.log("onCreateClient");
}

function onReadClient(options, packet) {
	console.log("onReadClient", packet);
	mapResponse[packet.key].writeHead(200, {
		"Content-Type": "application/json"
	});
	mapResponse[packet.key].end(JSON.stringify(packet));
	delete mapResponse[packet.key];
}

// Microservie 접속 종료 처리
function onEndClient(options) {
	var key = options.host + ":" + options.port;
	console.log("onEndClient", mapClients[key]);
	for (var n in mapClients[key].info.urls) {
		var node = mapClients[key].info.urls[n];
		delete mapUrls[node];
	}
	delete mapClients[key];
}

function onErrorClient(options) {
	console.log("onErrorClient");
}
