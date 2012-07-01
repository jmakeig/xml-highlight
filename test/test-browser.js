/**
 * Given the formatted HTML, parse the JSON and run
 *
 */
function testJSON(html /* String */, tests /* <Array<>> */) /* Array<String> */ {
  var outcomes = [];
  var result;
  try {
    //console.log($(html).text());
    result = JSON.parse($(html).text());
  } catch(err) {
    outcomes.push("Couldn't parse: " + err.toString());
    return outcomes;
  }
  if(!tests) return outcomes;
  for(var i = 0; i < tests.length; i++) {
    try {
      // This means that tests use "data" as the context for the result, e.g. data[0].firstName === 'Wayne'
      var data = result; 
      if(!eval(tests[i])) {
        var msg = "Failed assertion: " + tests[i];
        console.warn(msg);
        outcomes.push(msg);
      }
    } catch(err) {
      outcomes.push(err.toString());
      continue; 
    }
  }
  return outcomes;
}