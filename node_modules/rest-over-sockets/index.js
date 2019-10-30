const RouteParser=require("route-parser");


/**
 * Response
 */
class Response {

	/**
	 * Constructor
	 *
	 * @param {number} [status=200] the HTTP status code
	 * @param {string} [content_type='text/json'] the content type to use
	 */
	constructor(status=200, content_type="text/json") {

		this.payload={
			status: 	status,
			headers:	{
				"Content-Type": content_type
			}
		};

		this._callback=()=>{};		// No-op, will be replaced 
	}

	/**
	 * Send
	 *
	 * Send the response.  You can only call this once.
	 *
	 * @throw {Error} error if you call this more than once
	 */
	send() {

		if (!this._callback) {

			throw new Error("Response.send() can only be called once");
			return this;
		}

		if(!this._callback) throw new Error("Response.send() can only be called once");

		// Send can only be called once.  Get the callback, then delete it
		let callback=this._callback;
		delete this._callback;

		// Call the callback with a copy of our data structure
		callback({ ... this.payload});	
		return this;
	}

	set callback(cb) {

		this._callback=cb;
	}

	/** 
	 * Add data item to response
	 *
	 * Follows JSON API https://jsonapi.org/
	 *
	 * @param {string} type the type of the item, e.g. "Dog"
	 * @param {number} id the id of the item, e.g. 23
	 * @param {object} attributes the actual object data
	 * return {Response} this for easy stacking
	 */
	data(type, id, attributes) {

		if(!this.payload.data) this.payload.data=[];

		this.payload.data.push({

			type: type,
			id: id,
			attributes: { ... attributes}

		});
		return this;
	}

	/**
	 * Set status
	 *
	 * @param {number} status the HTTP status code to use
 	 * return {Response} this for easy stacking
	 */
	status(status)  {

		// TODO - validate status codes here?
		this.payload.status=status;
		return this;
	}

	/**
	 * Add/set header
	 *
	 * Like similar Express response
	 *
	 * @param {string} name the name of the header
	 * @param {string} value the value of the header
	 * return {Response} this for easy stacking
	 */ 
	set(name, value){

		this.payload.headers[name]=value;
		return this;
	}

	/**
	 * Add error
	 *
	 * Error will appear in response as JSON API https://jsonapi.org/
	 * Setting an error will also delete any data you have assigned and reset the HTTP response code
	 *
	 * @param {string} title the title of the error
	 * @param {object} opts the options
	 * @param {number} [opts.status=500] the new HTTP response status
	 * @param {string} [opts.detail] details of this error
	 * return {Response} this for easy stacking
	 */ 
	error(title, opts={}) {

		// Set default options
		Object.assign({detail: "", status: 500}, opts);

		// Clear data
		delete this.payload.data;

		// Set error
		if(!this.payload.errors) this.payload.errors=[];
		this.payload.errors.push({

			title:	title,
			detail: opts.detail
		});

		// Set status
		this.payload.status=opts.status;

		return this;
	}

}

/**
 * 
 * requestHandler(req, response)
 *
 * @callback requestHandler
 * @param {Request} req the request object
 * @param {Response} response the response you are sending to the client
 */

/**
 * 
 * responseHandler(response)
 *
 * @callback responseHandler
 * @param {Response} response the response that should be sent back to the client
 */

/**
 * Global definition of Request object
 *
 * @typedef Request
 * @type {object}
 * @property {object} params the captured parameters, see https://www.npmjs.com/package/route-parser
 * @property {string} path the requested path
 * @property {string} method GET, PUT, POST, etc
 */ 

/**
 * REST over sockets
 *
 */
class Restos {

	constructor() {

		this.handlers=[];		
	}


	/**
	 * PUT
	 * 
	 * Add a route handler for PUT on a given path
	 *
	 * @param {string} path the URL path.  Supports parameter capture, like "/dogs/:id/name"
	 * @param {requestHandler} handler the request handler
	 * @return {object} this a reference to ourselves, for ease in stacking
	 */
	put(path, handler){	this.add_handler("put", path, handler);	}

	/**
	 * DELETE
	 * 
	 * Add a route handler for DELETE on a given path
	 *
	 * @param {string} path the URL path.  Supports parameter capture, like "/dogs/:id/name"
	 * @param {requestHandler} handler the request handler
	 * @return {object} this a reference to ourselves, for ease in stacking
	 */
	delete(path, handler){	this.add_handler("delete", path, handler);	}

	/**
	 * POST
	 * 
	 * Add a route handler for POST on a given path
	 *
	 * @param {string} path the URL path.  Supports parameter capture, like "/dogs/:id/name"
	 * @param {requestHandler} handler the request handler
	 * @return {object} this a reference to ourselves, for ease in stacking
	 */
	post(path, handler){	this.add_handler("post", path, handler);	}

	/**
	 * GET
	 * 
	 * Add a route handler for GET on a given path
	 *
	 * @param {string} path the URL path.  Supports parameter capture, like "/dogs/:id/name"
	 * @param {requestHandler} handler the request handler
	 * @return {object} this a reference to ourselves, for ease in stacking
	 */
	get(path, handler){	this.add_handler("get", path, handler);	}

	/**
	 * PATCH
	 * 
	 * Add a route handler for PATCH on a given path
	 *
	 * @param {string} path the URL path.  Supports parameter capture, like "/dogs/:id/name"
	 * @param {requestHandler} handler the request handler
	 * @return {object} this a reference to ourselves, for ease in stacking
	 */
	patch(path, handler){	this.add_handler("patch", path, handler);	}

	/**
	 * Receive
	 * 
	 * Call this when new data has been received for processing
	 *
	 * @param {object} data the received data from the client (do not pass a string, de/encoding is your responsibility)
	 * @param {responseHandler} callback 
	 * @return {Response} Response that was (or will be) sent - caution, this happens asynchronously so the Response may still be changing when you get it back
	 */
	receive(o={}, callback){


		// Require a callback
		if(typeof(callback)!="function") throw new Error("Restos.receive() requires a callback function for response handling");

		// Set up a Response object with the callback it will need to return data
		let response=new Response();
		response.callback=callback;

		// Require a method and path
		if(typeof(o.method)!="string") {

			return response.error("Bad Request", { status: 400, detail: "Restos.receive() requires the first parameter to contain a value called 'method'"}).send();
		}

		// Require a method and path
		if(typeof(o.path)!="string") {

			return response.error("Bad Request", { status: 400, detail: "Restos.receive() requires the first parameter to contain a value called 'path'"}).send();
		}


		// Find a matching route
		for(let handler of this.handlers) {

			if(o.method.toLowerCase()==handler.method) {

				let params;
				if(params=handler.route.match(o.path)) {

					try {

						handler.handler(Object.assign({ params: params}, o), response);	// The handler is responsible for calling Response.send()
						return response;

					} catch(e) {

						return response.error("Internal Error", { status: 500, detail: e.message}).send();
					}
				}
			}
		}

		return response.error("Not Found", { status: 404, detail: "The page or resource you are looking for does not exist"}).send();
	}

	/**
	 * Add a handler 
	 *
	 * @private
	 * @param {string} method one of "GET", "POST", etc
	 * @param {string} path the URL path.  Supports parameter capture, like "/dogs/:id/name"
	 * @param {requestHandler} handler the request handler
	 * @return {object} this a reference to ourselves, for ease in stacking
 	 */
	add_handler(method, path, handler) {

		this.handlers.push({

			method: method,
			route: new RouteParser(path),
			handler: handler
		});

		return this;
	}




}



module.exports=exports=Restos;