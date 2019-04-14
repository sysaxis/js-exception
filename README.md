
# js-exception

* Define custom exceptions/errors
* Add extra information
* Logger-friendly output and serialization
* Consume from anywhere
* Simple and intuitive syntax
* No dependencies

## Why?

Sometimes an application produces known errors (exceptions) that need to be handled appropriately by the consumer. For this to be possible the consumer must be able to recognize the exception.
**js-exception** enables to easily define exceptions by giving them a code and/or codename.
Throwing such an exception wraps the application produced error and allows adding proprietary information for later debbuging or handling the exception.

## Usage

```js
const Exception = require('js-exception');
```

Create a custom exception class and define the exceptions by providing an exception code and/or codename.
```js
class SampleEx extends Exception {
    get TooBusy() {
        return this.create(1, 'TOO_BUZY')
    }
    get TooSlow() {
        return this.create(2, 'TOO_SLOW');
    }
    get TooSimple() {
        return this.create('WAY_TOO_SIMPLE');
    }
    get TooEasy() {
        return this.create(0);
    }
}
```
Throwing a simple exception:
```js
throw new SampleEx().TooBusy();
```
```json
{
    "stack": "Error at ...",
    "message": "",
    "code": 1,
    "codename": "TOO_BUZY"
}
```
Throwing exception using an error:
```js
var error = new Error('get error from somewhere');

throw new SampleEx(error).TooSlow({speed: 0.41});
```
```json
{
    "stack": "Error at ...",
    "message": "get error from somewhere",
    "code": 2,
    "codename": "TOO_SLOW",
    "speed": 0.41
}
```

Handling an exception (somewhere):
```js
var ex; // get exception from somewhere, such as web response

switch(ex.codename) {
    case 'TOO_SLOW':
        alert('application was too slow');
        break;
    case 'TOO_BUZY':
        alert('our servers are too buzy at the moment');
        break;
    default:
        // unhandled Exception or unknown Error
}
```

## Test

```js
node test
```
