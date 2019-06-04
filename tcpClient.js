var net = require("net");
var options = {
	port: 9000,
	host: "127.0.0.1"
};

var client = net.connect(options, () => {
	console.log("tcp server is connected");
});

client.on("data", data => {
	console.log(data.toString());
});

client.on("end", () => {
	console.log("tcp server is disconnected");
});
