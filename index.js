(function() {
  /**
   * Checks XQuery syntax (using xdmp:pretty-print).
   *
   * @param input The XQuery string to validate
   * @param handleSuccess The function to invoke if the query is valid
   * @param handleError The function to invoke if the query is not valid
   */
  function staticCheck(input, handleSuccess, handleError) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if(this.readyState === 1) { /* Loading */ }
      if(this.readyState === 4) {
        if (this.status >= 200 && this.status < 300) {
          handleSuccess("OK");
        } else {
          handleError(JSON.parse(this.responseText).error);
        }
      }
    } 
    xhr.open("POST", "/check.xqy", true);
    xhr.setRequestHeader("Content-Type", "application/vnd.marklogic-xdmp");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(input);
  }
  $(document).ready(function(evt) {
    $("#input-xml").on("input", // "input" is a new HTML5 event (Woo-hoo!)
      delay(
        function() {
          staticCheck(
            $("#input-xml").val(),
            function() { 
              $("#input-xml").trigger("validate", [true]);
            },
            function(error) { 
              $("#input-xml").trigger("validate", [false, error]);
            }
          );
        }, 
        500
      )
    );

    $("#input-xml").on("validate", function(evt, isValid, error){
      var errEl = $("#error-message");
      if(isValid) {
        errEl.text("Valid");
        $("#run").removeAttr('disabled');
      } else {
        errEl.text(error.formatString);
        $("#run").attr('disabled','disabled');
      }
    });

    $("#output").keydown(function(e) {
      // Listen to Select All keyboard shortcuts
      if(65 === e.keyCode && isJustCommandKey(e)) {
        console.log("select all");
        // This is a hack because one wouldn't want to
        // copy the metadata (i.e. declared types)
        $(this).find(".result-type").hide();
        e.preventDefault();
        selectElementText(this);
      }
    }).blur(function(e) {
      // Show the declared type metadata upon leaving.
      // See above. I can't think of a way to capture
      // the "afterSelectAll" event
      $(this).find(".result-type").show();
    });

    $("#run").click(function(evt) {
      console.time("fetch results");
      $("#output").append('<div class="status-overlay">Working…</div>');
      var options = getOptions();
      getInput(
        function(results) {
          console.timeEnd("fetch results");
          console.time("render");
          formatResults(results, options, $("#output"));
          console.timeEnd("render");
          $("#output").trigger("results", [results]);
          //$(".element, .comment").addClass("collapsed");
          /* Expand the root element only */
          //$(".root > .element, .root > .comment").removeClass("collapsed");
        }, function(error) {
          $("#output").html('<div class="error">' + error + '</div>');
          $("#output").trigger("results", [error]);
        });
    });

    function getOptions() {
      return {
        "truncate": parseInt($("#truncate").val()),
        "shortMax": parseInt($("#short-max").val()),
        "maxResults": parseInt($("#results-max").val()),
        "tabIndex": 100
      }
    }

    function getInput(
      handler /* function(results<Array<Object<type, content>>>) */,
      errorHandler /* function(error) */) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if(this.readyState === 1) { /* Loading */ }
        if(this.readyState === 4) {
          if (this.status >= 200 && this.status < 300) {
            handler(JSON.parse(this.responseText));
          } else {
            //console.log(this.responseText);
            errorHandler(this.responseText);
          }
        }
      } 
      var trunc = {"truncate": (getOptions().truncate)}
      xhr.open("POST", buildURL("/eval.xqy", trunc), true);
      xhr.setRequestHeader("Content-Type", "application/xquery");
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send($("#input-xml").val());
    }
    
    function buildURL(url, params) {
      var qs = $.param(params);
      var conn = "";
      if(qs) conn = "?";
      return url + conn + qs;
    }

    function formatResults(results /*Array<Object<type, content>>*/, options, target/*jQuery node*/) {
      // If it's a single result, wrap it in an array
      if(!results.length) { results = [results]; }
      var accumulator = [];
      var target = $(target || document.body.append("<div/>"));

      // Allow truncation of the total number of results for performance
      var len = results.length;
      if(options.maxResults > 0) len = Math.min(results.length, options.maxResults);
      
      accumulator.push('<div class="results-meta">Displaying '+ len +' result' + (len > 1 ? 's' : '') +'</div>');
      
      for(var i = 0; i < len; i++) {
        var result = results[i];
        accumulator.push('<div class="result-item ' + result.type + '-type">');
        accumulator.push('<div class="result-type">' + (result.type || "empty") + '</div>');
        if("element" === result.type || "document" === result.type || "comment" === result.type || "processing-instruction" === result.type) {
          // TODO: Proper truncation
          // FIXME: This actually assumes things are happending in order, since it's using the global accumulator variable
          // highlight(result.content, function(output) {
          //  accumulator.push(output);
          // }, options,
          // function(error) { 
          //    $("#output").html('<div class="error">' + error + '</div>');            
          // });
          accumulator.push('<pre class="' + result.type +'-raw">' + escapeForHTML(result.content) + '</pre>');
        }
        else if("text" === result.type) {
          accumulator.push("<div class='value type-" + result.type + "'><span class='text'>" + (escapeForHTML(result.content) || "&nbsp;") + "</span></div>");
        }
        else if("attribute" === result.type) {
          var tokens = result.content.split("=");
          var name = tokens[0];
          var value = tokens[1].substring(1, tokens[1].length - 1);
          accumulator.push("<span class='root'><span class='attribute free-standing'><span class='attribute-name'>" + name + "</span>=&quot;<span class='attribute-value'>" + escapeForHTML(value) + "</span>&quot;</span></span>");
        }
        else if("string" === result.type) {
          accumulator.push("<div class='value type-" + result.type + "'>" + escapeForHTML(result.content || " ") + "</div>");
        }
        else if("json" === result.type || "json-basic" === result.type) {
          highlightJSON(result.content, function(output) {
            accumulator.push(output);
            // http://stackoverflow.com/questions/11181791/difference-in-display-of-inline-elements-when-toggled-programmatically-and-decla
            // TODO: Need to fix json-array and object
          }, null, 
          function(error) { 
              $("#output").html('<div class="error">' + error + '</div>');            
          });
        }
        else {
          accumulator.push("<div class='value type-" + result.type + "'>" + (result.content || "&nbsp;") + "</div>");
        }
        accumulator.push('</div>'); // div.result-item
      }
      //console.log(accumulator.join(""));
      target.html(accumulator.join(""));
      cleanUp(target, options);
    }

    /**
     * DOM-level clean-up code. The implicatiopn is that this level of clean-up can't be farmed out to a Web Worker.
     * TODO: This should probably be refactored to better encapsulate.
     */
    function cleanUp(target, options) {
      console.log("cleanUp");
      /* Clean up ***********************************************************************************************/

      // Empty Elements
      // ==============
      // Track down the final text node for the element open to update it with a closing slash
      // (This should really be done in the parser? Or should it?)
      // Remove .element-values from empty elements
      target.find(".element:not(:has(.text, .element, .comment, .processing-instruction))")
        .addClass("empty")
        .find(".element-open").contents()
        .filter(function() {
          return this.nodeType == 3 && this.nextSibling == null;
        }).replaceWith("/>");
      $(".element.empty > .element-value, .element.empty > .element-close").remove(); 

      // Inline "short" text nodes
      // =========================
      // For each element if its text contents doesn't contain a line break and it's shorter than the
      // global shortMax option, give it a .short class to display inline
      target.find(".element").each(function(i) {
        if($(this).find(".text").children("br").length > 0) return; // if there's a line break, don't treat it as .short
        var len = $(this).find(".text").text().length;
        //console.log(len + ": " + $(this).find(".text").text());
        var el = $(this).closest(".element");
        //el.addClass("simple");
        if(len < options.shortMax ) el.addClass("short");
      });
      target.find(".attribute-value:has(br)").addClass("multi");
    }

    // Delegate click events for expand/collapse to the output container, rather
    // than attaching to each individual node
    $("#output").delegate(".toggle, .processing-instruction-close", "click", function(evt) {
      //$(evt.currentTarget).closest(".element, .comment, .processing-instruction, .json-object, .json-array").toggleClass("collapsed");
      $(this).closest(".element, .comment, .processing-instruction, .json-object, .json-array").toggleClass("collapsed");
        // http://stackoverflow.com/questions/11181791/difference-in-display-of-inline-elements-when-toggled-programmatically-and-decla
        //.end().siblings(".json-array-value").toggleClass("force-inline");
      $(evt.currentTarget).next(".element-open, .comment-open, .processing-instruction-open, .json-object-open, .json-array-open").focus();
      evt.stopPropagation();
    });

    $("#output").delegate(".element-raw", "click", function(evt){
      var pre = $(this);
      highlight(pre.text(), function(output) {
        $(pre).replaceWith(output);
        cleanUp($("#output"), getOptions());
      }, options,
      function(error) { 
         $("#output").html('<div class="error">' + error + '</div>');            
      });
    });
    
    function getDetails(elData, attrData, handler, errorHandler) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if(this.readyState === 1) { /* Loading */ }
        if(this.readyState === 4) {
          if (this.status >= 200 && this.status < 300) {
            var details;
            try {
              details = JSON.parse(this.responseText)
            } catch(error) {
              console.error(this.responseText);
            }
            handler(details, elData, attrData);
          } else {
            console.error(this.responseText);
            if(errorHandler) errorHandler(this.responseText);
          }
        }
      }
      xhr.open("GET", "/node-properties.xqy?" + $.param(elData) + (attrData ? "&" + $.param(attrData) : ""), true);
      xhr.send();
    }
    
    function renderDetails(details, $el, $attr) {
      tmpl.get($("#node_details_template").attr("src"), function(template) {
        //console.dir(details);
        $("#node-details").html(
          tmpl(template, details.node)
        ).css({top: $($el).offset().top + "px", right: "2em"});
      });
    }
    
    $("#output").delegate(".element-name", "click", function(evt) {
      var el = $(evt.currentTarget).closest(".element");
       $("#node-details").show();
      getDetails(el.data(), null, function(details, e, a) {
        renderDetails(details, el);
      });
    });
    
    $("#output").delegate(".attribute-name", "click", function(evt) {
      var attr = $(evt.currentTarget).closest(".attribute");
      var el = attr.closest(".element");
      getDetails(el.data(), attr.data(), function(details, e, a) {
        renderDetails(details, el);
      });
    });
    
    $("#node-details").hide();
    $("#node-details").delegate(".detail-close", "click", function(evt) {
      $("#node-details").hide();
    });
    
    // Handle key events: When an element, comment, or PI opener is actively focused the right key
    // expands that element and the left key collapses it. Tab selects the next one (using the
    // default @tabindex behavior, not DOM events).
    $("#output").keydown(function(evt) {
      var RIGHT = 39;
      var LEFT = 37;
      var DOWN = 40;
      var UP = 38;

      var active = $(document.activeElement);
      if(active.is(".element-open, .comment-open, .processing-instruction-open")) {
        var el = active.parent();
        switch(evt.which) {
          case RIGHT:
            el.removeClass("collapsed");
            evt.preventDefault();
            break;
          case LEFT:
            el.addClass("collapsed");
            evt.preventDefault();
            break;
          /*
          case DOWN:
            var candidates = el.find(".element").length > 0 ? el.find(".element") : el.nextAll(".element")
            candidates.first().find(".element-open").focus();
            evt.preventDefault();
            break;
          case UP:
            el.prevAll(".element").first().find(".element-open").focus();
            evt.preventDefault();
          */
          default:
            break;
        }

      }
    });

    /*
    $("#output").delegate(".result-item:has(.root)", "mouseenter mouseleave", function(evt) {
      var item = $(evt.currentTarget).closest(".result-item");
      switch(evt.type) {
        case "mouseenter":
          if(0 === item.has(".more-info").length) {
            // Turn this into an HTML template
            item.append("<div class='more-info'><button class='result-item-collapse-all'>Collapse All</button><button class='result-item-expand-all'>Expand All</button></div>");
          }
          item.addClass("highlight");
          break;
        case "mouseleave":
          item.removeClass("highlight");
          break;
        default:
          throw new Error(evt.type);
      }
    });

    // Result item-level collapse and expand
    $("#output").delegate(".result-item .result-item-expand-all", "click", function(evt) {
      $(evt.currentTarget).closest(".result-item").find(".element, .comment, .processing-instruction").removeClass("collapsed");
    });

    $("#output").delegate(".result-item .result-item-collapse-all", "click", function(evt) {
      var item = $(evt.currentTarget).closest(".result-item");
      item.find(".element, .comment, .processing-instruction").addClass("collapsed");
      item.find(".root > .element").removeClass("collapsed");
    });
    */

    /*
    $("#output").delegate(".element-open", "focus", function(evt) {
      // This actually works. Stash for a hover event
      //console.log($(this).attr("tabindex"));
      renderDetails()
    });
    */

    // Global collapse and expand
    $("#collapse-all").click(function(evt) {
      $(".element, .comment, .processing-instruction, .json-object, .json-array").addClass("collapsed");
      $(".root .element").first().removeClass("collapsed");
    });
    $("#expand-all").click(function(evt) {
      $(".element, .comment, .processing-instruction, .json-object, .json-array").removeClass("collapsed");
    });

    $("#hide-close-tags").change(function(evt) {
      $("#output .root").toggleClass("hide-close-tags");
    });

    $("#input-xml-source").change(function(evt) {
      var val = $(this).val();
      $("#output").html("");
      if("" === val) {
        $("#input-xml").val("");
      } else {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if(this.readyState === 1) { /* Loading */ }
          if(this.readyState === 4) {
            if (this.status >= 200 && this.status < 300) {
              $("#input-xml").val(this.responseText);
              $("#run").click();
            } else {
              console.error(this.responseText);
              if(errorHandler) errorHandler(this.responseText);
            }
          }
        }
        xhr.open("GET", "test/inputs/" + val + "?" + Math.random(), true);
        xhr.send();
      }
    });
    //$("#input-xml").val($("#input-xml-source").val());
    //$("#input-xml-source").change();

    // UGLY
    $("#options").click(function(evt) {
      $(this).next("div").toggle();
    });
    $("#options").next("div").toggle();
    
    // Run through each of the JSON and XML serializations to make sure they actually parse. This should be a pretty safe bet that all works.
    $("#validate").click(function(evt){
      var count = 0;
      $(".result-item.json-basic-type .root").each(
        function(i, el) { 
          try {
            JSON.parse($(this).text());
            console.log("Validated JSON " + i);
          } catch(err) {
            console.error(err);
            count++;
          }
        }
      );
      $(".result-item.element-type .root").each(
        function(i, el) { 
          try {
            $.parseXML($(this).text());
            console.log("Validated XML (element) " + i);
          } catch(err) {
            console.error(err);
            count++;
          }
        }
      );
      alert("There are " + count + " validation errors.")
    });
    
    //$('#run').click();
  });
})();