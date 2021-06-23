This file can be used both for generating data and workload file for the demo. 
After running it it generates 2 files - bulkwrite.txt (for populating data) and workload.txt (for operations).

See the Makefile for how to compile the new Workload generator.

The program has two modes of execution.
 1. To generate 10000000 data entries with keys between -2147483648 and 2147483648 and values as a default string with uniform distribution use the command
 `./newWorkload` 
 which defaults to a uniform distribution
 2. To do this with a skew distribution instead, use the command
 `./newWorkload -skew`

To configure the settings, use the arguments when running it as specified by the help function (`-h`).
The arguments are listed below, where the number you want to replace the default replacing the variable name (i.e. `-n 1000`).
 * `-skew` Changes the distribution from uniform to skew
 * `-n numKeys` Number of keys in the data file - Default: 10,000,000
 * `-l numPointLookups` Number of point lookups in the workload - Default: 10
 * `-z numZeroResultPointLookups` Number of zero result point lookups in the workload - Default: 10
 * `-i numInserts` Number of inserts in the workload - Default: 10
 * `-u numBlindUpdates` Number of blind updates in the workload - Default: 10
 * `-w numReadModifyUpdates` Number of read modify updates in the workload - Default: 10
 * `-r numNonEmptyRangeLookups` Number of non-empty range lookups in the workload - Default: 10
 * `-e numEmptyRangeLookups` Number of empty range lookups in the workload - Default: 10
 * `-m maxKey` Maximum key in the key space, which goes from -maxKey to maxKey - Default: INT_MAX
 * `-s skewBoundary` The divider of the key space into two separate uniform distributions to generate skewed data - Default: 1000
 * `-p skewProbability` The probability of picking between the two seperate uniform distributions to generate skewed data - Default: 0.5
 * `-rl rangeLength` The size of the range used for range queries in the workload - Default: 100

Here are some examples of how to run the new Workload generator:
 1. `./newWorkload -uniform -n 1000 -l 3 -z 2 -i 3 -u 3 -w 2 -r 3 -e 2 -m 10000 -rl 50`
 2. `./newWorkload -skew -n 1000 -l 3 -z 2 -i 3 -u 3 -w 2 -r 3 -e 2 -m 10000 -s 9000 -p 0.5 -rl 200`
