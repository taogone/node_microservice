"use strict";

const net = require("net");
const tcpClient = require("./client.js");

class tcpServer {
	constructor(name, port, urls) {
		this.logTcpClient = null; // 로그 관리 마이크로서비스 연결 클라이언트
		this.context = {
			port: port,
			name: name,
			urls: urls
		};
		this.merge = {};

		// 서버 생성
		this.server = net.createServer(socket => {
			// 클라이언트 접속 이벤트 처리
			this.onCreate(socket);

			// 에러 이벤트 처리
			socket.on("error", exception => {
				this.onClose(socket);
			});

			// 클라이언트 접속 종료 이벤트 처리
			socket.on("close", () => {
				this.onClose(socket);
			});

			// 데이터 수신 처리
			socket.on("data", data => {
				var key = socket.remoteAddress + ":" + socket.remotePort;
				var sz = this.merge[key]
					? this.merge[key] + data.toString()
					: data.toString();
				var arr = sz.split("¶");
				for (var n in arr) {
					if (sz.charAt(sz.length - 1) != "¶" && n == arr.length - 1) {
						this.merge[key] = arr[n];
						break;
					} else if (arr[n] == "") {
						break;
					} else {
						this.writeLog(arr[n]);
						this.onRead(socket, JSON.parse(arr[n]));
					}
				}
			});
		});
		// 서버 객체 에러 처리
		this.server.on("error", err => {
			console.log(err);
		});
		// 리슨
		this.server.listen(port, () => {
			console.log("listen", this.server.address());
		});
	}
	onCreate(socket) {
		console.log("onCreate", socket.remoteAddress, socket.remotePort);
	}
	onClose(socket) {
		console.log("onClose", socket.remoteAddress, socket.remotePort);
	}

	// Distributor 접속 함수
	connectToDistributor(host, port, onNoti) {
		// Distributor 전달 패킷 정의
		var packet = {
			uri: "/distributes",
			method: "POST",
			key: 0,
			params: this.context
		};
		// Distributor 접속 상태
		var isConnectedDistributor = false;
		// Client Class Instance generation
		this.clientDistributor = new tcpClient(
			host,
			port,
			// 접속 이벤트
			options => {
				isConnectedDistributor = true;
				this.clientDistributor.write(packet);
			},
			// 데이터 수신 이벤트
			(options, data) => {
				if (this.logTcpClient == null && this.context.name != "logs") {
					for (var n in data.params) {
						const ms = data.params[n];
						if (ms.name == "logs") {
							this.connectToLog(ms.host, ms.port);
							break;
						}
					}
				}
				onNoti(data);
			},
			// 접속 종료 이벤트
			options => {
				isConnectedDistributor = false;
			},
			// 에러 이벤트
			options => {
				isConnectedDistributor = false;
			}
		);
		// 주기적으로 Distributor에 접속 시도
		setInterval(() => {
			if (isConnectedDistributor != true) {
				this.clientDistributor.connect();
			}
		}, 3000);
	}
	connectToLog(host, port) {
		this.logTcpClient = new TcpClient(
			host,
			port,
			options => {},
			options => {
				this.logTcpClient = null;
			},
			options => {
				this.logTcpClient = null;
			}
		);
		this.logTcpClient.connect();
	}
	writeLog(log) {
		if (this.logTcpClient) {
			const packet = {
				uri: "/logs",
				method: "POST",
				key: 0,
				params: log
			};
			this.logTcpClient.write(packet);
		} else {
			console.log(log);
		}
	}
}

module.exports = tcpServer;
