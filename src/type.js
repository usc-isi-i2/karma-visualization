var LocString=String(window.document.location.href); 
function getQueryStr(str){  
    var rs = new RegExp("(^|)"+str+"=([^\&]*)(\&|$)","gi").exec(LocString), tmp;  
      
    if(tmp=rs)
    {  
        return tmp[2];  
    }  
      
    // parameter cannot be found  
    return "";  
}  


//width, height, center position, radius, padding, defaultsize,filename
        var w = 1300;
        var h = 700;
        var centerx ;
        var centery;
        var r = 280;
        var padding = 10;
        var circlepad = 1.5;
        var clusterpad = 6;
        var dsize = 7;
        var maxr = 100;
        var havecolor = true;
        var havesize = true;
        var filename = getQueryStr("filename");

        //colorset, sizeset, groupset,strokeset, widthset, frequency of each size appears
        var colorset = [];
        var sizeset = [];
        var groupset = [];
        var frequency = [];
        var strokeset = [];
        var widthset = [];

        //help
        var indexnow = 0;
        var turn = true;
        var small = 1;
        var large = 50;
        var maxsize = 0;
        var minsize = 0;
        var save;
        var numcluster;
        var turn = true;
        var tfactor = 10;//scale factor
        var havesize;
        var showtype = {};
        showtype.sticks = "<http://karma.isi.edu/visualization/VerticalStick>";
        showtype.circles = "<http://karma.isi.edu/visualization/Circle>";
        var showcircle = true;
        
        //data for circles, links
        var datacircle = [];
        var datalink = [];

        //links, circles, svg, clusters, texts
        var links;
        var sticks;
        var texts;
        var rects;
        var recttexts;
        var circles;
        var bigrect;
        var groups;
        var svg = d3.select("body")
                    .append("svg")
                    .attr("width", w)
                    .attr("height", h);
        var clusters;
        groups = svg.selectAll("g");
        texts = svg.selectAll("text");
        recttexts = groups.selectAll("text");
        rects = groups.selectAll("rect");
        circles = svg.selectAll("circle");
        sticks = svg.selectAll("line");
       /* bigrect = svg.append("rect")
                     .attr("width", w)
                     .attr("height", h)
                     .attr("fill", "white")
                     .on("click",function(){
                        force.resume();
                        if(turn)
                        {
                            //for(var i = 0;i < numcluster;i++)
                              //  centery[i] = h / 2;
                            for(var i = 0;i < groupset.length;i++)
                                centerx[i] = w / 2;
                            turn = false;
                        }
                        else
                        {
                            //for(var i = 0;i < numcluster;i++)
                              //  centery[i] =  h / (numcluster+5) * (i+3);
                            for(var i = 0;i < groupset.length;i++)
                                centerx[i] = w / (groupset.length+1) * (i+1) + 50;
                            turn = true;
                        }
                        });*/

        //force layout
        var force = d3.layout.force()   
                    .charge(-10)
                    .gravity(.02)
                    .linkDistance(30)
                    .size([w,h]);

        //scales
        var colorscale = d3.scale.ordinal().range(d3.scale.category10().range());
        var sizescale = d3.scale.linear().range([small, large]);          
        
        //find defferent id for circles
         var find = function(x)
            {
                for(var i = 0;i < datacircle.length;i++)
                {
                    if(datacircle[i].id == x["@id"])
                    {
                        return datacircle[i];
                    }
                }
                return null;
            };


        //parse size
        var sizeparse = function(size)
        {
            if(typeof(size) == "number")
                return size;
            else
            {
                var newsize = size.replace(",", "");
                if(isNaN(parseInt(newsize)) == false)
                    return parseInt(newsize);
                if(isNaN(parseFloat(newsize)) == false)
                    return parseInt(newsize);
            }
            return size;
        }

        //deal with scale
        var smartscale = function()
        {
            var area = 0;
            datacircle.forEach(function(d){
                        area += sizescale(d.size) * sizescale(d.size) * 3.14;
                    });
            var t = Math.sqrt(w * h / area / tfactor);
            small *= t;
            large *= t;
            sizescale.range([small, large]);

        }
    
        //defferent ticks
        var tick;
        var tickdefault = function()
        {
            circles.attr("cx", function(d){return d.x;})
                   .attr("cy", function(d){return d.y;});
                   
        }
        var tickforcluster = function(e)
        {

            datacircle.forEach(movetocenter(e.alpha));
            datacircle.forEach(collide(e.alpha));
            circles.attr("cx", function(d){return d.x;})
                   .attr("cy", function(d){return d.y;});
            sticks.attr("x1", function(d){return d.x;})
                  .attr("x2", function(d){return d.x;})
                  .attr("y1", function(d){return d.y + 2*sizescale(d.size);})
                  .attr("y2", function(d){return d.y - 2*sizescale(d.size);});
        }

        var movetocenter = function(alpha)
        {
            return function(d)
            {
                //alert(centerx[d.groupnum]-d.x);
                d.x += (centerx[d.groupnum] - d.x) * 0.1 * alpha;
                d.y += (centery[d.cluster] - d.y) * 0.1 * alpha;
            }
        }
        
        //collide
        var collideStick = function(alpha)
        {
            return function(node1)
            {
                datacircle.forEach(function(node2){
                        if(node1 == node2)
                            return;
                        var disx = node1.x - node2.x;
                        var disy = node1.y - node2.y;
                        var dis = Math.sqrt(disx*disx + disy*disy);
                        var shortest = sizescale(node1.size)/2 + sizescale(node2.size)/2 + padding;
                       // alert(shortest);
                        if(dis < shortest)
                        {
                            node1.x += (shortest-dis) / dis * disx * 0.5 * alpha;
                            node1.y += (shortest-dis) / dis * disy * 0.5 * alpha;
                            node2.x -= (shortest-dis) / dis * disx * 0.5 * alpha;
                            node2.y -= (shortest-dis) / dis * disy * 0.5 * alpha;
                        }
                        })
            }

        }

        var collideCircle = function(alpha)
        {
            return function(node1)
            {
                datacircle.forEach(function(node2){
                        if(node1 == node2)
                            return;
                        var disx = node1.x - node2.x;
                        var disy = node1.y - node2.y;
                        var dis = Math.sqrt(disx*disx + disy*disy);
                        var shortest = sizescale(node1.size) + sizescale(node2.size) + padding;
                       // alert(shortest);
                        if(dis < shortest)
                        {
                            node1.x += (shortest-dis) / dis * disx * 0.5 * alpha;
                            node1.y += (shortest-dis) / dis * disy * 0.5 * alpha;
                            node2.x -= (shortest-dis) / dis * disx * 0.5 * alpha;
                            node2.y -= (shortest-dis) / dis * disy * 0.5 * alpha;
                        }
                        })
            }

        }
        var collide = collideCircle;
    
        //json data
        d3.json(filename, function(err, data){
                if(err) return console.error(err);
                save = data;
                if(data[0]["@type"][0] == showtype.circles)
                {   
                    showcircle = true;
                    collide = collideCircle;
                }
                else
                {
                    showcircle = false;
                    collide = collideStick;
                }
                for(var i = 0;i < data.length;i++)
                {
                    var n = {};
                    var fnode = find(data[i]);
                    if(fnode == null)
                    {
                        n.id = data[i]["@id"];
                        n.type = data[i]["@type"];
                        if(data[i]["k3:size"] != null)
                        {
                            n.size = data[i]["k3:size"];
                            if(sizeset.indexOf(data[i]["k3:size"]) == -1)
                            {
                                sizeset.push(n.size);
                                n.sizeindex = sizeset.indexOf(n.size);
                                frequency.push(0);
                            }
                            n.sizeindex = sizeset.indexOf(n.size);
                            frequency[sizeset.indexOf(n.size)]++;
                        }
                        else
                        {
                            n.size = dsize;
                        }
                        if(data[i]["k3:fillColor"] != null)
                        {
                            n.color = data[i]["k3:fillColor"];
                            if(colorset.indexOf(data[i]["k3:fillColor"]) == -1)
                            {
                                colorset.push(n.color);
                            }
                            n.cluster = colorset.indexOf(n.color);
                        }
                        else
                        {
                            n.cluster = 0;
                        }
                        if(data[i]["k3:group"] != null)
                        {
                            n.group = data[i]["k3:group"];
                            if(groupset.indexOf(data[i]["k3:group"]) == -1)
                            {
                                groupset.push(n.group);
                            }
                            n.groupnum = groupset.indexOf(n.group);
                        }
                        else
                        {
                            n.group = "";
                            n.groupnum = 0;
                        }
                        if(data[i]["rdfs:label"] != null)
                        {
                            n.label = data[i]["rdfs:label"];
                        }
                        datacircle.push(n);
                    }

                }
                if(colorset.length == 0)
                {
                    numcluster = 1;
                    colorscale.domain([1,10]);
                    havecolor = false;
                }
                else
                {
                    numcluster = colorset.length;
                    colorscale.domain(colorset);
                }
                if(sizeset.length == 0)
                    havesize = false;
                else
                {
                    //parse size here
                    if(showcircle == true)
                    {
                        for(var i = 0;i < sizeset.length;i++)
                            sizeset[i] = Math.sqrt(Math.abs(sizeparse(sizeset[i])));
                        datacircle.forEach(function(d){d.size = Math.sqrt(Math.abs(sizeparse(d.size)));});
                    }
                    else
                    {
                        for(var i = 0;i < sizeset.length;i++)
                            sizeset[i] = Math.abs(sizeparse(sizeset[i]));
                        datacircle.forEach(function(d){d.size = Math.abs(sizeparse(d.size));});
                    }
                    if(typeof(sizeset[0]) == "number")
                    {
                        sizeset.sort(function(a,b){return a-b;});
                        if(sizeset[0] == 0)
                            sizeset.shift();
                        var f = sizeset[0];
                        for(var j = 0;j < sizeset.length;j++)
                            sizeset[j] /= f;
                        datacircle.forEach(function(d){d.size /= f;});
                        large = sizeset[sizeset.length-1];
                        if(large > 50)
                            large = 50;
                        sizescale.range([small, large]);
                        sizescale.domain([sizeset[0], sizeset[sizeset.length-1]+1]);
                    }    
                    else
                    {
                        datacircle.forEach(function(d){d.size = frequency[d.sizeindex];});
                        frequency.sort();
                        sizescale.domain([frequency[0], frequency[frequency.length-1]+1]);
                    }
                    
                }
                //smartscale
                smartscale();
                if(groupset.length == 0)
                    groupset.push("");

                //center
                centery = new Array(numcluster);
                centerx = new Array(groupset.length);
                for(var i = 0;i < numcluster;i++)
                    centery[i] = h / (numcluster+5) * (i+3);
                for(var i = 0;i < groupset.length;i++)
                   centerx[i] = w / (groupset.length + 1) * (i+1); 
                force.nodes(datacircle).links(datalink)
                    .charge(function(d){ return -0.15 * sizescale(d.size) * sizescale(d.size);})
                     .start();
                var c = Math.floor(Math.random() * 10);
                // draw elements
                circles = circles.data(datacircle)
                                 .enter()
                                 .append("circle")
                                 .attr("r", function(d){
                                            return sizescale(d.size);
                                         })
                                .attr("fill", function(d){
                                         //return "red";
                                         if(showcircle == false)
                                            return "white";
                                         if(havecolor)
                                            return colorscale(d.color);
                                         else
                                         {
                                            d.color = colorscale(c);
                                            return d.color;
                                         }
                                         })
                                 .attr("title", function(d){return d.label;})
                                 .call(force.drag);
                sticks = sticks.data(datacircle)
                               .enter()
                               .append("line")
                               .attr("opacity", function(){
                                   if(showcircle == true)
                                        return 0;
                                    return 1;
                               })
                               .style("stroke", function(d){
                                        if(havecolor)
                                            return colorscale(d.color);
                                         else
                                         {
                                            d.color = colorscale(c);
                                            return d.color;
                                         }})
                               .style("stroke-width", 2)
                               .call(force.drag);
                texts = texts.data(groupset)
                             .enter()
                             .append("text")
                             .text(function(d){return d.substr(0, 20);})
                             .attr("x", function(d){return centerx[groupset.indexOf(d)] - 10*groupset.length - 15;})
                             .attr("y", 40);
                groups = groups.data(colorset)
                               .enter()
                               .append("g");
                rects = groups.append("rect")
                             .attr("x", 10)
                             .attr("y", function(d,i){return i* 25 + 40;})
                             .attr("height", 20)
                             .attr("width", 40)
                             .attr("fill", function(d){return colorscale(d);});
                recttexts  = groups.append("text")
                                     .attr("x", 55)
                                     .attr("y", function(d,i){return i* 25 + 58;})
                                     .attr("class", "rt")
                                     .attr("font-size", 20)
                                     .attr("text-anchor", "left")
                                     .text(function(d){return d;});
                
                });
                
                //tick
                tick = tickforcluster;
                force.on("tick",tick);


                //transition
               /* svg.on("click", function(){
                        force.resume();
                        if(turn)
                        {
                            for(var i = 0;i < numcluster;i++)
                                centerx[i] = w / 2;
                            turn = false;
                        }
                        else
                        {
                            for(var i = 0;i < numcluster;i++)
                                centerx[i] =  w / (numcluster+1) * (i+1);
                            turn = true;
                        }
                        })        */  
                document.getElementById("all").onclick = function(){ 
                    force.resume();
                    for(var i = 0;i < groupset.length;i++)
                        centerx[i] = w / 2;
                    texts.transition()
                         .duration(500)
                         .attr("x", function(d){return centerx[groupset.indexOf(d)] - 40;})
                         .attr("y", 40)
                         .text("");   
                            
                    turn = false;
                };      
                document.getElementById("group").onclick = function(){ 
                    force.resume();
                    for(var i = 0;i < groupset.length;i++)
                        centerx[i] = w / (groupset.length+1) * (i+1);
                    texts.transition()
                        .duration(3000)
                        .ease("elastic")
                        .attr("x", function(d){return centerx[groupset.indexOf(d)] - 40;})
                         .attr("y", 40)
                         .text(function(d){return d.substr(0,20)});
                    turn = true;
                    };

