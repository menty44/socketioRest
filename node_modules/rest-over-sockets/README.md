# REST-over-sockets

REST API over (Web)sockets using an [Express](https://www.npmjs.com/package/express) style interface

- 100% native javascript
- Compatible with [Websockets](https://www.npmjs.com/package/ws) and [Sockhop](https://www.npmjs.com/package/sockhop)
- Supports parameter capture, automatic error handling, and response encoding 


## Why

You have an application whose only clients connect directly over TCP/IP
- or -  
your clients all support Websockets
- and -  
you don't see the point in programming multiple API endpoints - some REST over HTTP, some over Websockets.
## Details

##### Request

Incoming requests are simple native ```object```, presumably transmitted over the wire using JSON.  You can do this yourself, or you can use a library like [Sockhop](https://www.npmjs.com/package/sockhop "Sockhop on NPM"). 


| Parameter | Type   | Example           | Required | Notes                                                  |
|-----------|--------|-------------------|----------|--------------------------------------------------------|
| method    | string | "POST"            | Y        |                                                        |
| path      | string | "/photos/cat.jpg" | Y        |                                                        |
| params    | object | { id: 23}         | N        |  RESERVED - auto populated from URL capture parameters |
| {...}     | any    |                   | N        | User managed, passed to handler                        |

```json
{
	"method": "GET",
	"path": "/apple/3444"
}
```

##### Response
Outgoing data conform to [JSON API](https://jsonapi.org/) spec.  If your hanlder throws an exception, the error will automatically result in a HTTP style ```500``` response.  Routes that don't exist return a HTTP style ```404``` error.
```json
{
    "status": 200,
    "headers": {
        "Content-Type": "text/json"
    },
    "data": [
        {
            "type": "Apple",
            "id": "23",
            "attributes": {
                "flavor": "sweet"
            }
        }
    ]
}
```

## Examples
##### Server using Websockets
```javascript
const wss=new (require("ws")).Server({ port: 8080 });
const restos=new (require("rest-over-sockets"))();

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
```
##### Client using Websockets
```javascript
const ws= new (require("ws"))("ws://localhost:8080/");

ws.on("open", ()=>{

	ws.send(JSON.stringify({

		method : 	"GET",
		path :		"/widget/23"

	}));
});

ws.on("message", (data)=>{

	console.log(data);  // {"status":200,"headers":{"Content-Type":"text/json"},"data":[{"type":"Apple","id":"23","attributes":{"flavor":"sweet"}}]}
	ws.close();
});
```
Of course, Websockets has it's limitations.  If you are able to use native sockets, use Sockhop since it will automatically handle remote callbacks to ensure the response is given to the request that called it.  It also handles JSON encoding and possible packetization / fragmentation across the wire.
##### Server using Websockets
```javascript
const server=new (require("sockhop").server)();
const restos=new (require("rest-over-sockets"))();

server.listen();
server.on("receive", (o, meta)=>restos.receive(o, meta.callback));

restos.get("/apple/:id", (req, res)=>{
		res
    	.set('Content-Type', 'text/json')
        .status(200)
        .data("Apple", req.params.id, { flavor: "sweet" })
        .send();	
});
```
##### Client using Websockets
```javascript
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
```

### Notes

Make sure your handlers (added by calling ```.get()```, ```.post()```, etc) run asynchronously.  Example:
```
// BAD!
restos.get("/some/path", (req, res)=>{
	
		NASTY_BLOCKING_TASK();

		/* ... */

		res.send();	
});


// GOOD
restos.get("/some/path", (req, res)=>{
	
		return new Promise((resolve)=>{

			NASTY_BLOCKING_TASK();

			/* ... */

			resolve();
		})
		.then(res.send);
});

```


### Documentation
## Classes

<dl>
<dt><a href="#Response">Response</a></dt>
<dd><p>Response</p>
</dd>
<dt><a href="#Restos">Restos</a></dt>
<dd><p>REST over sockets</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#requestHandler">requestHandler</a> : <code>function</code></dt>
<dd><p>requestHandler(req, response)</p>
</dd>
<dt><a href="#responseHandler">responseHandler</a> : <code>function</code></dt>
<dd><p>responseHandler(response)</p>
</dd>
<dt><a href="#Request">Request</a> : <code>object</code></dt>
<dd><p>Global definition of Request object</p>
</dd>
</dl>

<a name="Response"></a>

## Response
Response

**Kind**: global class  

* [Response](#Response)
    * [new Response([status], [content_type])](#new_Response_new)
    * [.send()](#Response+send)
    * [.data(type, id, attributes)](#Response+data)
    * [.status(status)](#Response+status)
    * [.set(name, value)](#Response+set)
    * [.error(title, opts)](#Response+error)

<a name="new_Response_new"></a>

### new Response([status], [content_type])
Constructor


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [status] | <code>number</code> | <code>200</code> | the HTTP status code |
| [content_type] | <code>string</code> | <code>&quot;&#x27;text/json&#x27;&quot;</code> | the content type to use |

<a name="Response+send"></a>

### response.send()
Send

Send the response.  You can only call this once.

**Kind**: instance method of [<code>Response</code>](#Response)  
**Throw**: <code>Error</code> error if you call this more than once  
<a name="Response+data"></a>

### response.data(type, id, attributes)
Add data item to response

Follows JSON API https://jsonapi.org/

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | the type of the item, e.g. "Dog" |
| id | <code>number</code> | the id of the item, e.g. 23 |
| attributes | <code>object</code> | the actual object data return {Response} this for easy stacking |

<a name="Response+status"></a>

### response.status(status)
Set status

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>number</code> | the HTTP status code to use return {Response} this for easy stacking |

<a name="Response+set"></a>

### response.set(name, value)
Add/set header

Like similar Express response

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | the name of the header |
| value | <code>string</code> | the value of the header return {Response} this for easy stacking |

<a name="Response+error"></a>

### response.error(title, opts)
Add error

Error will appear in response as JSON API https://jsonapi.org/
Setting an error will also delete any data you have assigned and reset the HTTP response code

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| title | <code>string</code> |  | the title of the error |
| opts | <code>object</code> |  | the options |
| [opts.status] | <code>number</code> | <code>500</code> | the new HTTP response status |
| [opts.detail] | <code>string</code> |  | details of this error return {Response} this for easy stacking |

<a name="Restos"></a>

## Restos
REST over sockets

**Kind**: global class  

* [Restos](#Restos)
    * [.put(path, handler)](#Restos+put) ⇒ <code>object</code>
    * [.delete(path, handler)](#Restos+delete) ⇒ <code>object</code>
    * [.post(path, handler)](#Restos+post) ⇒ <code>object</code>
    * [.get(path, handler)](#Restos+get) ⇒ <code>object</code>
    * [.patch(path, handler)](#Restos+patch) ⇒ <code>object</code>
    * [.receive(data, callback)](#Restos+receive) ⇒ [<code>Response</code>](#Response)

<a name="Restos+put"></a>

### restos.put(path, handler) ⇒ <code>object</code>
PUT

Add a route handler for PUT on a given path

**Kind**: instance method of [<code>Restos</code>](#Restos)  
**Returns**: <code>object</code> - this a reference to ourselves, for ease in stacking  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | the URL path.  Supports parameter capture, like "/dogs/:id/name" |
| handler | [<code>requestHandler</code>](#requestHandler) | the request handler |

<a name="Restos+delete"></a>

### restos.delete(path, handler) ⇒ <code>object</code>
DELETE

Add a route handler for DELETE on a given path

**Kind**: instance method of [<code>Restos</code>](#Restos)  
**Returns**: <code>object</code> - this a reference to ourselves, for ease in stacking  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | the URL path.  Supports parameter capture, like "/dogs/:id/name" |
| handler | [<code>requestHandler</code>](#requestHandler) | the request handler |

<a name="Restos+post"></a>

### restos.post(path, handler) ⇒ <code>object</code>
POST

Add a route handler for POST on a given path

**Kind**: instance method of [<code>Restos</code>](#Restos)  
**Returns**: <code>object</code> - this a reference to ourselves, for ease in stacking  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | the URL path.  Supports parameter capture, like "/dogs/:id/name" |
| handler | [<code>requestHandler</code>](#requestHandler) | the request handler |

<a name="Restos+get"></a>

### restos.get(path, handler) ⇒ <code>object</code>
GET

Add a route handler for GET on a given path

**Kind**: instance method of [<code>Restos</code>](#Restos)  
**Returns**: <code>object</code> - this a reference to ourselves, for ease in stacking  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | the URL path.  Supports parameter capture, like "/dogs/:id/name" |
| handler | [<code>requestHandler</code>](#requestHandler) | the request handler |

<a name="Restos+patch"></a>

### restos.patch(path, handler) ⇒ <code>object</code>
PATCH

Add a route handler for PATCH on a given path

**Kind**: instance method of [<code>Restos</code>](#Restos)  
**Returns**: <code>object</code> - this a reference to ourselves, for ease in stacking  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | the URL path.  Supports parameter capture, like "/dogs/:id/name" |
| handler | [<code>requestHandler</code>](#requestHandler) | the request handler |

<a name="Restos+receive"></a>

### restos.receive(data, callback) ⇒ [<code>Response</code>](#Response)
Receive

Call this when new data has been received for processing

**Kind**: instance method of [<code>Restos</code>](#Restos)  
**Returns**: [<code>Response</code>](#Response) - Response that was (or will be) sent - caution, this happens asynchronously so the Response may still be changing when you get it back  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | the received data from the client (do not pass a string, de/encoding is your responsibility) |
| callback | [<code>responseHandler</code>](#responseHandler) |  |

<a name="requestHandler"></a>

## requestHandler : <code>function</code>
requestHandler(req, response)

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| req | [<code>Request</code>](#Request) | the request object |
| response | [<code>Response</code>](#Response) | the response you are sending to the client |

<a name="responseHandler"></a>

## responseHandler : <code>function</code>
responseHandler(response)

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| response | [<code>Response</code>](#Response) | the response that should be sent back to the client |

<a name="Request"></a>

## Request : <code>object</code>
Global definition of Request object

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | the captured parameters, see https://www.npmjs.com/package/route-parser |
| path | <code>string</code> | the requested path |
| method | <code>string</code> | GET, PUT, POST, etc |


## TODO

## License
MIT
