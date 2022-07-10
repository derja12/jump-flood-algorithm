
var app = new Vue({
    el: '#app',
    data: {
        ctx: null,
        canvas: null,
        newCanvasWidth: 200,
        newCanvasHeight: 200,
        
        dataIndex: 0,
        dataArray: [],
        
        newSeedCount: 5,
        seedsPlanted: false,
        JFAButtonText: "Iterate JFA",
        seeds: [],
        s_colors: [],
        JFA_ONLINE: false,
        JFA_K: -1
    },
    methods: {
        drawFancyRectangle: function () {
            let imageData = this.getImageData();        
            for (var y = 0; y < imageData.height; y++) {
                for (var x = 0; x < imageData.width; x++) {
                    // let x = 5;
                    let i = this.getPixelIndex(x,y, imageData);
                    // console.log(i)
                    let ratio = i / imageData.data.length;
                    let red = Math.floor(ratio * 255);
                    // red = (y % 2 + 1) * 255;
                    imageData.data[i] = red;

                    let green = (i % 1024) / 4;
                    // green = (y % 2) * 128;
                    imageData.data[i+1] = green;

                    let width_ratio = ((i/4) % imageData.width) / imageData.width;
                    let blue = Math.floor(width_ratio * 200) + 56;
                    imageData.data[i+2] = blue;

                    let alpha = Math.floor(width_ratio * 200) + 56;
                    imageData.data[i+3] = 255;
                }
            }
            this.updateImage(imageData);
        },
        getImageData: function() {
            let imageData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
            return imageData;
        },
        updateImage: function(imageData, addDataIndex=true) {
            this.ctx.putImageData(imageData,0,0);
            if (addDataIndex) {
                this.addNewDataArray();
            }
        },
        resetCanvasClick: function(addDataIndex=true) {
            this.canvas.height = this.newCanvasWidth;
            this.canvas.width = this.newCanvasHeight;
            let imageData = this.getImageData();
            for (var i=0; i < imageData.data.length;i += 4) {
                let red = 0;
                imageData.data[i] = red;
                let green = 0;
                imageData.data[i+1] = green;
                let blue = 0;
                imageData.data[i+2] = blue;
                let alpha = 0;
                imageData.data[i+3] = alpha;
            }
            this.updateImage(imageData, addDataIndex);
            this.seedsPlanted = false;
            this.JFA_ONLINE = false;
        },
        onUpdateDimensions: function() {
            this.canvas.height = this.newCanvasWidth;
            this.canvas.width = this.newCanvasHeight;
        },
        seedPicture: function(seeds=2) {
            this.resetCanvasClick(false);
            this.seeds = [];
            this.s_colors = [];
            let imageData = this.getImageData();
            for (let i = 0; i < seeds; i++) {
                let r = Math.floor(Math.random() * 100) + 50;
                let g = Math.floor(Math.random() * 100) + 50;
                let b = Math.floor(Math.random() * 100) + 50;
                let random_color = [r,g,b,255];
                this.s_colors.push(random_color);
                let newseed = [];
                let x = Math.floor(Math.random() * imageData.width);
                let y = Math.floor(Math.random() * imageData.height);
                newseed.push(x, y);
                imageData = this.setPixel(x, y, i, imageData);
                this.seeds.push(newseed);
            }
            this.seedsPlanted = true;
            if (!this.JFA_ONLINE) {
                this.startJFA();
            }
            this.updateImage(imageData);
            return;
        },
        setPixel: function(x, y, seed, imageData) {
            for (let i = 0; i < 4; i++) {
                imageData.data[this.getPixelIndex(x, y, imageData) + i] = this.s_colors[seed][i];
            }
            return imageData;
        },
        getPixelIndex: function(x, y, imageData) {
            return x * 4 + y * imageData.width * 4;
        },
        startJFA: function() {
            if (this.seeds.length == 0) {
                console.error("cannot start algorithm with '0' seeds");
                return;
            }
            imageData = this.getImageData();
            let initial_k = 0;
            if (imageData.width > imageData.height) initial_k = imageData.width / 2;
            else initial_k = imageData.height / 2;
            this.JFA_K = initial_k; // initial K value of N/2
            this.JFA_ONLINE = true;
        },
        iterateJFA: function(verbose=false) {
            if (!this.JFA_ONLINE) {
                this.startJFA();
            }
            let imageData = this.getImageData();

            for (let y = 0; y < imageData.height; y++) {
                for (let x = 0; x < imageData.width; x++) {
                    // for every pixel
                    for(let i = -this.JFA_K; i <= this.JFA_K; i += this.JFA_K) {
                        for(let j = -this.JFA_K; j <= this.JFA_K; j += this.JFA_K) {
                            let p = this.getPixelSeed(x, y, imageData);
                            if (verbose) console.log(i, j);
                            // for each neighbor q at (x+i, y+j)
                            // q = [128,255,0,255]
                            let q = this.getPixelSeed(x + i, y + j, imageData);
                            if (!this.isSeedDefined(p) && this.isSeedDefined(q)) { 
                                // if p is undefined and q is colored
                                // change p's color to q's
                                if (verbose) console.log("updated", x, "x", y, "y to", this.s_colors[q]);
                                imageData = this.setPixel(x, y, q, imageData);
                            } else if (this.isSeedDefined(p) && this.isSeedDefined(q)) {
                                // check p's distance from both seeds
                                if (this.getDistanceFromSeed(x, y, p) > this.getDistanceFromSeed(x, y, q)) {
                                    imageData = this.setPixel(x, y, q, imageData);
                                }
                            }
                        }   
                    }
                }
            }
            this.updateImage(imageData);
            this.JFA_K = Math.floor(this.JFA_K / 2);
            if (this.JFA_K == 0) {
                this.JFA_K = 1;
            }
        },
        getPixelColor: function(x, y, imageData) {
            if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
                return -1;
            }
            let r = imageData.data[this.getPixelIndex(x,y,imageData)];
            let g = imageData.data[this.getPixelIndex(x,y,imageData) + 1];
            let b = imageData.data[this.getPixelIndex(x,y,imageData) + 2];
            let a = imageData.data[this.getPixelIndex(x,y,imageData) + 3];
            return [r,g,b,a];
        },
        getPixelSeed: function(x, y, imageData) {
            let color = this.getPixelColor(x, y, imageData);
            if (color == -1) return -1;
            if (assertEqualList(color, [0,0,0,0])) return -1; // default color value
            for (i in this.s_colors) {
                if (assertEqualList(color, this.s_colors[i])) {
                    return i;
                }
            }
        },
        isSeedDefined: function(p) {
            // undefined color == -1
            return (p != -1);
        },
        getDistanceFromSeed: function(x, y, seed) {
            let diff_x = x - this.seeds[seed][0];
            let diff_y = y - this.seeds[seed][1];
            return Math.sqrt(diff_x * diff_x + diff_y * diff_y);
        },
        getPixels: function() {
            let pixels = [];
            this.picture.forEach(row => {
                row.forEach(pixel => {
                    pixels.push(pixel);
                });
            });
            return pixels;
        },
        addNewDataArray: function() {
            newDataArray = [this.canvas.width, this.canvas.height, this.JFA_K, this.JFA_ONLINE, this.seedsPlanted, this.seeds, this.s_colors, this.getImageData()];
            this.dataArray.push(newDataArray);
            this.loadDataFromIndex(this.dataArray.length-1);
        },
        incrementCurrentDataIndex: function() {
            if (this.dataArray.length > this.dataIndex) {
                this.dataIndex += 1;
                this.loadDataFromIndex(this.dataIndex);
                }
        },
        decrementCurrentDataIndex: function() {
            if (this.dataIndex > 0) {
                this.dataIndex -= 1;
                this.loadDataFromIndex(this.dataIndex);
            }
        },
        loadDataFromIndex: function (index) {
            this.canvas.width = this.dataArray[index][0];
            this.canvas.height = this.dataArray[index][1];
            this.JFA_K = this.dataArray[index][2];
            this.JFA_ONLINE = this.dataArray[index][3];
            this.seedsPlanted = this.dataArray[index][4];
            this.seeds = this.dataArray[index][5];
            this.s_colors = this.dataArray[index][6];
            this.ctx.putImageData(this.dataArray[index][7],0,0);
            this.dataIndex = index;
        }
    },
    mounted() {
        var canvas = document.getElementById("canvas");
        this.canvas = canvas;
        canvas.height = this.newCanvasHeight;
        canvas.width = this.newCanvasWidth;
        var ctx = canvas.getContext("2d");
        this.ctx = ctx;
        this.addNewDataArray();
    }
});

function assertEqualList(list_1, list_2) {
    if (list_1.length != list_2.length) return false;
    for (let i = 0; i < list_1.length; i++) {
        if (list_1[i] != list_2[i]) return false;
    }
    return true;
}


function roughSizeOfObject ( object ) {
    
    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}