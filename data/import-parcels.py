from csv import DictReader
from re import sub
import json

if __name__ == '__main__':

    statuses = list()

    with open('statuses-2014-08-26.csv', 'rU') as f:
        for row in DictReader(f, dialect='excel'):
            if row['latitude']:
                statuses.append(row)
                statuses[-1]['latitude'] = float(statuses[-1]['latitude'])
                statuses[-1]['longitude'] = float(statuses[-1]['longitude'])
    
    for status in statuses:
        id = sub(r'\W', '-', status['address'])
        with open('parcels/{0}.json'.format(id), 'w') as f:
            json.dump(status, f, indent=2, sort_keys=True)
