/**
 * Given the formatted HTML, parse the JSON and optionally run tests.
 * Tests Strings of the form, "data.keyName === 'blah'". The String is eval'ed
 * with the data varaible as the parsed JSON. Tests must evaluate to true in 
 * order to pass.
 *
 * @return An array of 
 */
function testJSON(html /* String */, tests /* <Array<String>> */) /* Array<String> */ {
  return testStuff("json", html, tests);
}
function testXML(html /* String */, tests /* <Array<String>> */) /* Array<String> */ {
  return testStuff("xml", html, tests);
}

function testStuff(type, html /* String */, test) /* Array<String> */ {
  function makeResult(test, result) {
    return {
      "test": test,
      "result": result,
      "isPassed": (!result)
    }
  }
  var outcomes = [];
  var result;
  try {
    switch(type) {
      case "json":
        result = JSON.parse($(html).text());
        break;
      case "xml": 
        result = $.parseXML($(html).text());
        break;
      default: throw type + " is not valid";
    }
  } catch(err) {
    outcomes.push(makeResult(null, "Couldn't parse: " + err.toString()));
    return outcomes;
  }
  outcomes.push(makeResult("Parsing " + type, null));
  if(!test.assertions) return outcomes;
  for(var i = 0; i < test.assertions.length; i++) {
    var assertion = test.assertions[i];
    try {
      // This means that tests use "data" as the context for the result, e.g. data[0].firstName === 'Wayne'
      var data = result; 
      function xpath(expression) {
        return document.evaluate(expression, result, test.namespaceResolver, XPathResult.ANY_TYPE, null).iterateNext().nodeValue;
      }
      //console.dir(eval(assertion));
      //console.dir(data);

      if(!eval(assertion)) {
        var msg = "Failed assertion: " + assertion;
        console.warn(msg);
        outcomes.push(makeResult(assertion, msg));
      } else {
        outcomes.push(makeResult(assertion, null));
      }
    } catch(err) {
      outcomes.push(makeResult(null, err.toString()));
      continue; 
    }
  }
  return outcomes;
}