#!/bin/sh -ex
rm -rf tiles && mkdir -p tiles && python import-tiles.py
rm -rf parcels && mkdir -p parcels && python import-parcels.py
mkdir -p soft-story && ln -sv ../tiles soft-story/ && ln -sv ../parcels soft-story/
tar -czL --disable-copyfile - soft-story | ssh benzene "rm -rf /tmp/soft-story && tar -C /tmp -xzvf - && ls -l /tmp/soft-story && s3put -a $AWS_KEY -s $AWS_SECRET -b data.codeforamerica.org -g public-read -p /tmp /tmp/soft-story"
