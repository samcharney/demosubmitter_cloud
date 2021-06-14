all:
	clang++ -o workload workload.cc
	clang++ -std=c++11 -o newWorkload newWorkload.cc
test1:
	./newWorkload -uniform -n 1000 -l 3 -z 2 -i 3 -u 3 -w 2 -r 3 -e 2 -m 10000

test2:
	./newWorkload -skew -n 1000 -l 3 -z 2 -i 3 -u 3 -w 2 -r 3 -e 2 -m 10000 -s 9000 -p 0.5
