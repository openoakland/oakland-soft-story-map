Soft Stories - Data
==================

Soft story building sample data is not found here, but can be imported and transformed into
a static directory of geographic data files.

Install
-------

Python packages are listed in `requirements.txt`, and can be downloaded and
actived in a [virtual environment](https://pypi.python.org/pypi/virtualenv)
like this:

    make
    source venv-ohhs-map/bin/activate

Also create the file `Parcel.geojson` with parcel geometries, after installing
`ogr2ogr` using `brew install gdal` on mac or `apt-get install gdal-bin`
on linux:

    make Parcel.geojson

Usage
-----

`./import-tiles.py` will import building data from a remote URL and index it into
a directory of [GeoJSON](http://www.geojson.org/) files in `tiles`.

`./import-buildings.py` will import OHHS data from a remote URL and generate
a directory of per-building JSON files in `buildings`.
