#include <iostream>
#include <vector>
#include <cmath>
#include <cstdlib>
#include <random>
#include <iomanip>
#include <cstdint>
#include <cassert>

class params{
	public:
	unsigned int numKeys;
        unsigned int numPointLookups;
        unsigned int numZeroResultPointLookups;
        unsigned int numInserts;
        unsigned int numBlindUpdates;
        unsigned int numReadModifyUpdates;
        unsigned int numNonEmptyRangeLookups;
        unsigned int numEmptyRangeLookups;
	bool isUniform;

	params() {
		numKeys=1000*1000*10;
        	numPointLookups=10;
       		numZeroResultPointLookups=10;
       		numInserts=10;
        	numBlindUpdates=10;
        	numReadModifyUpdates=10;
	        numNonEmptyRangeLookups=10;
	        numEmptyRangeLookups=10;
        	isUniform=true;

	}
};

void help() {
	std::string s[]={
		"-uniform",
		"-skew",
		"-n numKeys",
		"-l numPointLookups",
		"-z numZeroResultPointLookups",
		"-i numInserts",
		"-u numBlindUpdates",
		"-w numReadModifyUpdates",
		"-r numNonEmptyRangeLookups",
		"-e numEmptyRangeLookups"
		};
	for(auto str:s) {
		std::cout<<str<<std::endl;
	}
	
}

int main(int argc, char* argv[]) {
	
	params args;

	for(int i=1; i<argc; i++) {
		std::string p=argv[i];
		if (p=="-uniform") {
			args.isUniform=true;
		}
		else if (p=="-skew") {
			args.isUniform=false;
		}
		else if (p=="-n") {
			i++;
  			assert(i<argc);
			args.numKeys=atoi(argv[i]);
		}
		else if (p=="-l") {
               		i++; 
			assert(i<argc);
			args.numPointLookups=atoi(argv[i]);
		}
		else if (p=="-z") {
			i++;
			assert(i<argc);
			args.numZeroResultPointLookups=atoi(argv[i]);
                }
		else if (p=="-i") {
			i++;
			assert(i<argc);
			args.numInserts=atoi(argv[i]);
                }
		else if (p=="-u") {
			i++;
			assert(i<argc);
			args.numBlindUpdates=atoi(argv[i]);
                }
                else if (p=="-w") {
			i++;
			assert(i<argc);
			args.numReadModifyUpdates=atoi(argv[i]);
                }
                else if (p=="-r") {
			i++;
			assert(i<argc);
			args.numNonEmptyRangeLookups=atoi(argv[i]);
                }
                else if (p=="-e") {
			i++;
			assert(i<argc);
			args.numEmptyRangeLookups=atoi(argv[i]);
                }
                else if (p=="-h") {
                	help();
			return 0;
		}
		else {
			std::cout<<"unrecognized option: "<<p<<std::endl;
			return 1;
		}

	}
	//do work here
	return 0;
}
