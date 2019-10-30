const ws= new (require("ws"))("ws://localhost:8080/");

ws.on("open", ()=>{

	ws.send(JSON.stringify({

		method : 	"GET",
		path :		"/widget/23"

	}));
});

ws.on("message", (data)=>{

	console.log(data);
	ws.close();
});

