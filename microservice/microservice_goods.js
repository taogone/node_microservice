"usr strict";

const business = require("../monolithic/monolithic_goods");
const cluster = require("cluster");

class goods extends require("./server") {
	constructor() {
		// 초기화
		super("goods", process.argv[2] ? Number(process.argv[2]) : 9010, [
			"POST/goods",
			"GET/goods",
			"DELETE/goods"
		]);
		// Distributor 접속
		this.connectToDistributor("127.0.0.1", 9000, data => {
			console.log("Distributor Notification", data);
		});
	}
	onRead(socket, data) {
		console.log("onRead", socket.remoteAddress, socket.remotePort, data);
		// 비즈니스 로직 호출
		business.onRequest(
			socket,
			data.method,
			data.uri,
			data.params,
			(s, packet) => {
				// 응답 패킷 전송
				socket.write(JSON.stringify(packet) + "¶");
			}
		);
	}
}

if (cluster.isMaster) {
	// child process starting
	cluster.fork();
	// if 'exit' event occurred then new child process starting.
	cluster.on("exit", (worker, code, signal) => {
		console.log("worker ${worker.process.pid} died.");
		cluster.fork();
	});
} else {
	new goods();
}
