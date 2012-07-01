/**
 * Given the formatted HTML, parse the JSON and optionally run tests.
 * Tests Strings of the form, "data.keyName === 'blah'". The String is eval'ed
 * with the data varaible as the parsed JSON. Tests must evaluate to true in 
 * order to pass.
 *
 * @return An array of 
 */
function testJSON(html /* String */, tests /* <Array<String>> */) /* Array<String> */ {
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
    //console.log($(html).text());
    result = JSON.parse($(html).text());
  } catch(err) {
    outcomes.push(makeResult(null, "Couldn't parse: " + err.toString()));
    return outcomes;
  }
  if(!tests) return outcomes;
  for(var i = 0; i < tests.length; i++) {
    var test = tests[i];
    try {
      // This means that tests use "data" as the context for the result, e.g. data[0].firstName === 'Wayne'
      var data = result; 
      if(!eval(test)) {
        var msg = "Failed assertion: " + test;
        console.warn(msg);
        outcomes.push(makeResult(test, msg));
      }
    } catch(err) {
      outcomes.push(makeResult(null, err.toString()));
      continue; 
    }
  }
  return outcomes;
}