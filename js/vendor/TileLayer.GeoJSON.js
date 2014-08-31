/*Copyright (c) 2012, Glen Robertson
All rights reserved. 

Redistribution and use in source and binary forms, with or without modification, are 
permitted provided that the following conditions are met: 

   1. Redistributions of source code must retain the above copyright notice, this list of 
      conditions and the following disclaimer. 

   2. Redistributions in binary form must reproduce the above copyright notice, this list 
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution. 

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE 
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR 
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS 
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
// Load data tiles using the JQuery ajax function
L.TileLayer.Ajax = L.TileLayer.extend({
    _requests: [],
    _data: [],
    data: function () {

        for (var t in this._tiles) {
            var tile = this._tiles[t];
            if (!tile.processed) {
                this._data = this._data.concat(tile.datum);
                tile.processed = true;
            }
        }
        return this._data;
    },
    _addTile: function(tilePoint, container) {
    
        var tile = { datum: null, processed: false };
        this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
        this._loadTile(tile, tilePoint);
    },
    // XMLHttpRequest handler; closure over the XHR object, the layer, and the tile
    _xhrHandler: function (req, layer, tile) {
        return function() {
            if (req.readyState != 4) {
                return;
            }
            var s = req.status;
            if ((s >= 200 && s < 300) || s == 304) {
                tile.datum = JSON.parse(req.responseText);
                layer._tileLoaded();
            } else {
                layer._tileLoaded();
            }
        }
    },
  loadedTiles:{},
    // Load the requested tile via AJAX
    _loadTile: function (tile, tilePoint) {
        if(this._map.getZoom() >= 17){
            var zoomDiff = this._map.getZoom() - 17;
            var zoom = (this._map.getZoom() > 17 ? 17 : this._map.getZoom())
            var newPoint = {x: Math.round(tilePoint.x / Math.pow(2, zoomDiff)), y: Math.round(tilePoint.y / Math.pow(2, zoomDiff)), z: zoom};
            if(newPoint.x+":"+newPoint.y+":"+newPoint.z  in this.loadedTiles){
                this._tilesToLoad--;
                return;
            }else{
                this.loadedTiles[newPoint.x+":"+newPoint.y+":"+newPoint.z]={};
            }
        }else{
            newPoint = tilePoint;
            newPoint.z = this._map.getZoom();
        }
        this._adjustTilePoint(newPoint);
        var layer = this;
        var req = new XMLHttpRequest();
        this._requests.push(req);
        req.onreadystatechange = this._xhrHandler(req, layer, tile);
        req.open('GET', L.Util.template(this._url, newPoint), true);
        req.send();
    },
    _resetCallback: function() {
        this._data = [];
        L.TileLayer.prototype._resetCallback.apply(this, arguments);
        for (var i in this._requests) {
            this._requests[i].abort();
        }
        this._requests = [];
    },
    _update: function() {
        if (this._map._panTransition && this._map._panTransition._inProgress) { return; }
        if (this._tilesToLoad < 0) this._tilesToLoad = 0;
        L.TileLayer.prototype._update.apply(this, arguments);
      this.loadedTiles ={};
		if (!this._map) { return; }

		var bounds = this._map.getPixelBounds(),
		    zoom = (this._map.getZoom() > 17 ? 17: this._map.getZoom()),
		    tileSize = this.options.tileSize;

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = L.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());

		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
    }
});

L.TileLayer.GeoJSON = L.TileLayer.Ajax.extend({
    _geojson: {"type":"FeatureCollection","features":[]},
    initialize: function (url, options, geojsonOptions) {
        L.TileLayer.Ajax.prototype.initialize.call(this, url, options);
        this.geojsonLayer = new L.GeoJSON(this._geojson, geojsonOptions);
        this.geojsonOptions = geojsonOptions;
    },
    onAdd: function (map) {
        this._map = map;
        L.TileLayer.Ajax.prototype.onAdd.call(this, map);
        this.on('load', this._tilesLoaded);
        map.addLayer(this.geojsonLayer);
        map.scrollWheelZoom.disable();
    },
    onRemove: function (map) {
        map.removeLayer(this.geojsonLayer);
        this.off('load', this._tilesLoaded);
        L.TileLayer.Ajax.prototype.onRemove.call(this, map);
    },
    data: function () {
        this._geojson.features = [];
        if (this.options.unique) {
            this._uniqueKeys = {};
        }
        var tileData = L.TileLayer.Ajax.prototype.data.call(this);
        for (var t in tileData) {
            var tileDatum = tileData[t];
            if (tileDatum && tileDatum.features) {

                // deduplicate features by using the string result of the unique function
                if (this.options.unique) {
                    for (var f in tileDatum.features) {
                        var featureKey = this.options.unique(tileDatum.features[f]);
                        if (this._uniqueKeys.hasOwnProperty(featureKey)) {
                          tileDatum.features.splice(f, 1);
                        }
                        else {
                            this._uniqueKeys[featureKey] = featureKey;
                        }
                    }
                }
                this._geojson.features =
                    this._geojson.features.concat(tileDatum.features);
            }
        }
        return this._geojson;
    },
    _resetCallback: function () {
        this._geojson.features = [];
        L.TileLayer.Ajax.prototype._resetCallback.apply(this, arguments);
    },
    _tilesLoaded: function (evt) {
      var data = this.data();
      this.geojsonLayer.clearLayers().addData(data);
    }
});
