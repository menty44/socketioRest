const wss=new (require("ws")).Server({ port: 8080 });
const restos=new (require("../../"))();

// Set up a server
wss.on("connection", (ws)=>{

	ws.on("message", (message)=> {

		restos.receive(JSON.parse(message),(response)=>{

			ws.send(JSON.stringify(response));
		});
	});
});
 
// Add an Express-style route
restos.get("/widget/:id", (req, res)=>{

		res
    	.set('Content-Type', 'text/json')
        .status(200)
        .data("Apple", req.params.id, { flavor: "sweet" })
        .send();	
});