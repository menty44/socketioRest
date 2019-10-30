const client=new (require("sockhop").client)();

client.connect().then(()=>{

	client.send({

		method: "GET",
		path: "/apple/3444"
	},(response)=>{

		console.log(`Response: ${JSON.stringify(response)}`);
		client.disconnect();
	});
});