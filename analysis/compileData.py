from csv import DictReader, DictWriter
from sys import argv
from datetime import datetime
from numpy import mean
from math import log

# parse arguments
if len(argv) != 5:
    print 'usage: %s trips_file accessibility_file popularities_file outfile' % argv[0]
    exit(1)

# load data
accessibilityByLabel = dict()

with open(argv[2]) as accessibilityRaw:
    accessibilityCsv = DictReader(accessibilityRaw)
    for r in accessibilityCsv:
        label = r['label']
        accessibilityByLabel[label] = r

# now, use terminals instead of labels; need to go back to original data to match up
accessibility = dict()
with open(argv[3]) as popRaw:
    for row in DictReader(popRaw):
        accessibility[row['terminal']] = accessibilityByLabel[row['name']]
         
del accessibilityByLabel

with open(argv[1]) as tripsRaw:
    trips = DictReader(tripsRaw)

    with open(argv[4], 'w') as outRaw:
        out = DictWriter(outRaw, ['id', 'dist', 'duration', 'speed', 'casual',  'weekend', 'jobs10', 'jobs30', 'jobs60', 'population10', 'population30', 'population60', 'bike30'])

        out.writeheader()

        for t in trips:
            # Note: the only unmatched station is Mezes Park (83)

            try:
                orig = accessibility[t['Start Terminal']]
            except KeyError:
                print 'Station %s (%s) unmatched' % (t['Start Station'], t['Start Terminal'])
                continue
            
            try:
                dest = accessibility[t['End Terminal']]
            except KeyError:
                print 'Station %s (%s) unmatched' % (t['End Station'], t['End Terminal'])
                continue            

            outt = dict()
            outt['id'] = t['Trip ID']
            # in meters
            outt['dist'] = round(pow(pow(float(orig['X']) - float(dest['X']), 2) + pow(float(orig['Y']) - float(dest['Y']), 2), 0.5))
            # in seconds
            outt['duration'] = int(t['Duration'])
            # in km/h
            outt['speed'] = round((float(outt['dist'])/outt['duration'])*3.6)

            outt['casual'] = t['Subscription Type'] == 'Customer'

            # 5 and 6 are Saturday and Sunday
            outt['weekend'] = datetime.strptime(t['Start Date'], '%m/%d/%Y %H:%M').weekday() >= 5
            
            # calculate the accessibility differences
            jobs10 = float(orig['jobs10'])/float(dest['jobs10'])
            jobs30 = float(orig['jobs30'])/float(dest['jobs30'])
            jobs60 = float(orig['jobs60'])/float(dest['jobs60'])
            population10 = float(orig['population10'])/float(dest['population10'])
            population30 = float(orig['population30'])/float(dest['population30'])
            population60 = float(orig['population60'])/float(dest['population60'])
            bike30 = float(orig['bike30'])/float(dest['bike30'])

            # Previously there had been an inversion step here, that inverted the ratios of accessibilities if more
            # than half of them were less than one, in order to treat round trips in the same way. While it was a
            # nice idea, it made the results harder to interpret without adding much in the way of descriptive potency.
            # If there was one accessibility ratio that was consistently near 1, it could flip some trips one way and
            # some trips the other.
            outt['jobs10'] = log(jobs10)
            outt['jobs30'] = log(jobs30)
            outt['jobs60'] = log(jobs60)
            outt['population10'] = log(population10)
            outt['population30'] = log(population30)
            outt['population60'] = log(population60)
            outt['bike30'] = log(bike30)

            out.writerows([outt])
                

                        
