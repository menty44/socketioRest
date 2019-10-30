const server=new (require("sockhop").server)();
const restos=new (require("../../"))();

server.listen();
server.on("receive", (o, meta)=>restos.receive(o, meta.callback));


restos.get("/apple/:id", (req, res)=>{

		res
    	.set('Content-Type', 'text/json')
        .status(200)
        .data("Apple", req.params.id, { flavor: "sweet" })
        .send();	
});

