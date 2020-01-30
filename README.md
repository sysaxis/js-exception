
# js-exception

## Features

* Define custom error types with default parameters such as message
* Create instances of custom types with optional parameters
* Application root path and traces of node_modules are removed from stack (default)
* Logger-friendly output and serialization
* Simple and intuitive syntax

## Why?

Sometimes an application produces known errors (exceptions) that need to be recognized and handled appropriately.

Exception (**js-exception**) allows creating unique Error types with optional default values.

Exception instances can wrap the application produced error and allow adding proprietary information for later debbuging or handling the error. They can be caught using filters or identified with inheritance checks (i.e instanceof).

## Usage

```js
const Ex = require('js-exception');
```

### Creating unique error types
```js
const SampleErrors = {
    TooBuzy: Ex.define({
        codename: 'TOO_BUZY',
        message: 'I am a default error message'
    }),
    TooSlow: Ex.define({codename: 'TOO_SLOW'}),
    TooSimple: Ex.define({codename: 'TOO_SIMPLE'})
}
```
### Throwing exceptions:
```js
throw new SampleErrors.TooBuzy();
```
```json
{
    "stack": "Error at ...",
    "message": "I am a default error message",
    "codename": "TOO_BUZY"
}
```
```js
throw new SampleErrors.TooBuzy('that went well...')
```
```json
{
    "stack": "Error at ...",
    "message": "that went well...",
    "codename": "TOO_BUZY"
}
```

### Throwing exception using an Error instance:
```js
var error = new Error('get error from somewhere');

throw new SampleErrors.TooSlow(error, {speed: 0.41});
```
```json
{
    "stack": "Error at ...",
    "message": "get error from somewhere",
    "codename": "TOO_SLOW",
    "speed": 0.41
}
```

### Recognizing exception instances:
```js
var ex; // get exception from somewhere
```

Classic approach
```js
switch(ex.constructor) {
    case SampleErrors.TooSlow:
        console.log('pick up the pace!');
        break;
    case SampleErrors.TooBuzy:
        console.log('sorry too buzy at the moment!');
        break;
    default:
        // unhandled Exception or unknown Error
}
```
Using if/else pattern
```js
if (ex.is(SampleErrors.TooSlow)) {
    console.log('not fast enough!');
}
else if (ex.is(SampleErrors.TooBuzy)) {
    console.log('ain\'t no rest for the wicked')
}
```

Using Promises (bluebird)
```js
new Promise
    .try(() => {
        throw ex;
    })
    .catch(SampleErrors.TooSlow, error => {
        // error caught
    })
```

## Configuration

### Keeping node_module traces
```js
Exception.keepModuleTraces = true;
```

## Major changes

### 0.7+
It seemed like the library was forcing a certain error design pattern (with error codes and codenames). It was decided to loosen it up.

1) Instance method **create()** will be deprecated.
    The following signature is not accepted anymore:
    ```js
    create(code<String>, codename<String>)
    ```
    Instead it is generalized as follows:
    ```js
    create(params<Object>)
    ```
    The given params object properties are assigned to every instance of created exception type.

    To keep the previous design pattern you need to rewrite it as follows
    ```js
    // from
    create(1, 'param2');
    // to
    create({code: 1, codenama: 'param2'})
    ```

2) Constructor has new signatures:
    ```js
    new Exception(params<Array>, defaults<Array>)
    new Exception(...params<Any>)
    ```
    Invividual parameters in params are assigned to the exception instance depending on their type: **Error** instance properties **message** and **stack**, **String** instance as **message** and for **Object** instance all of its properties.

    Constructor is still backward compatible with the previous signature:
    ```js
    new Exception(error<Error>|message<String>)
    ```


## Test

```js
node test
```
