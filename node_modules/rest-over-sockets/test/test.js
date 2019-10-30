const assert=require("assert");
const Restos=require("../index.js");


var restos;

describe("REST methods",()=>{


	(["GET", "POST", "DELETE", "PUT", "PATCH"]).forEach((method)=>{

		it(method, (done)=>{

			let restos=new Restos();

			// Set up a route
			restos[method.toLowerCase()]("/apple/:id", (req, res)=>{

					res
			    	.set('Content-Type', 'text/json')
			        .status(200)
			        .data("Apple", req.params.id, { flavor: "sweet" })
			        .send();	
			});


			// Transmit a payload to the server
			restos.receive({

				method: method,
				path: "/apple/3444"
				},(response)=>{

					assert.deepEqual(response, {"status":200,"headers":{"Content-Type":"text/json"},"data":[{"type":"Apple","id":"3444","attributes":{"flavor":"sweet"}}]});
					done();
				});

		});


	});

});

describe("Restos class",()=>{

	describe("receive()", ()=>{

		it("throws if no callback provided",()=>{

			let r=new Restos();
			assert.throws(
				r.receive
			);

		});

		it("returns 400 error if missing .path or .method",()=>{

			let r=new Restos();
			r.receive({method: "POST"},(response)=>{

				assert.deepEqual(response, { 
					status: 400,
					headers: { 'Content-Type': 'text/json' },
					errors: 
					[ { title: 'Bad Request', detail: 'Restos.receive() requires the first parameter to contain a value called \'path\'' } ] });
			});


			r.receive({path: "/something"},(response)=>{

				assert.deepEqual(response, { 
					status: 400,
					headers: { 'Content-Type': 'text/json' },
					errors: 
					[ { title: 'Bad Request', detail: 'Restos.receive() requires the first parameter to contain a value called \'method\'' } ] });
			});


		});

		it("returns 404 error if path not found",()=>{

			let r=new Restos();

			r.receive({path: "/something", method: "GET"},(response)=>{

				assert.deepEqual(response, { 
					status: 404,
					headers: { 'Content-Type': 'text/json' },
					errors: 
					[ { title: 'Not Found', detail: 'The page or resource you are looking for does not exist' } ] });
			});


		});



		it("returns 500 error if route throws an exception",(done)=>{

			let r=new Restos();

			// Set up a route that will throw an error
			r.post("/throw/an/error", (req, res)=>{

					throw new Error("This is an error");
			});

			r.receive({path: "/throw/an/error", method: "POST"},(response)=>{

				assert.deepEqual(response, { 
					status: 500,
					headers: { 'Content-Type': 'text/json' },
					errors: 
					[ { title: 'Internal Error', detail: 'This is an error' } ] 
				});

				done();

			});


		});


	});




});