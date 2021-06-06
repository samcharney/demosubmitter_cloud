#include <iostream>
#include <fstream>
#include <vector>
#include <cmath>
#include <cstdlib>
#include <random>
#include <iomanip>
#include <cstdint>
#include <cassert>
#include <limits>
#include <algorithm>
#include <iterator>

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
	unsigned int maxKey;
	std::ofstream bulkdata;
	std::ofstream workload;

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
		maxKey=INT_MAX;
		bulkdata.open("bulkwrite.txt");
		workload.open("workload.txt");
	}

    unsigned int num_ops() {
        return numPointLookups +
                numZeroResultPointLookups +
                numInserts +
                numBlindUpdates +
                numReadModifyUpdates +
                numNonEmptyRangeLookups +
                numEmptyRangeLookups;
    }

	void close() {
		bulkdata.close();
		workload.close();
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
template <typename T>
class uniform_random_numbers {
	std::uniform_int_distribution<T> distrib;
	std::mt19937 gen;

public:
	uniform_random_numbers(T lo, T hi) : distrib(lo, hi), gen(get_generator()) {}

std::mt19937 get_generator() {
	std::random_device rd;
	std::mt19937 gen(rd());
	return gen;
}

T get_random() {
	return distrib(gen);
}
};

std::vector<int> keys;
std::vector<unsigned int> values;

void generateKeys(params& args) {
    uniform_random_numbers<int> int_gen(-args.maxKey, args.maxKey);
    uniform_random_numbers<unsigned int> un_gen(1, 10000);
	
	keys.reserve(args.numKeys);
    values.reserve(args.numKeys);
	
	for (int i=0; i<args.numKeys; i++) {
		int key=int_gen.get_random();
		unsigned int val=un_gen.get_random();
		keys.push_back(key);
      	values.push_back(val);
		args.bulkdata << key << " " << val <<std::endl;
	}
}

void randomExistingKey(params& args) {
    
}

void generateWorkload(params& args) {
    std::vector<char> op_order(args.num_ops());
    
    unsigned int a1 = args.numPointLookups;
    unsigned int a2 = args.numZeroResultPointLookups +a1;
    unsigned int a3 = args.numInserts +a2;
    unsigned int a4 = args.numBlindUpdates +a3;
    unsigned int a5 = args.numReadModifyUpdates +a4;
    unsigned int a6 = args.numNonEmptyRangeLookups +a5;
    unsigned int a7 = args.numEmptyRangeLookups+a6;
    
    for(int i=0; i<op_order.size(); i++) {
        char op;
        if(i<a1) {
          op='l';
        }
        else if(i<a2) {
          op='z';
        } 
        else if(i<a3) {
          op='i';
        }
        else if(i<a4) {
          op='u';
        }
        else if(i<a5) {
          op='w';
        }
        else if(i<a6) {
          op='r';
        }
        else if(i<a7) {
          op='e';
        }
        else {
            assert(0); //should not happen
        }
        op_order[i]=op;
    }    

    std::random_device rd;
    std::mt19937 g(rd());
    
    //generates random permutation 
    std::shuffle(op_order.begin(), op_order.end(), g);

    uniform_random_numbers<unsigned int> old_keys(0, keys.size()-1);

    uniform_random_numbers<int> new_keys(-args.maxKey, args.maxKey);
    
    for(int i=0; i<op_order.size(); i++) {
        char op=op_order[i];
        switch(op) {
            case 'l':
            case 'z': {
                unsigned int index = old_keys.get_random();
                args.workload << op  << keys[index] << '\n';
                break;
                      }
            case 'i': {
                /*int new_key;
                bool isNew=false;
                do {
                    new_key=new_keys.get_random();
                } while(!isNew);*/
                break;
                      }
            case 'u':
            break;
            case 'w':
            break;
            case 'r':
            break;
            case 'e':
            break;
            default: assert(0); //should not happen
            break;

        }
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
                else if (p=="-maxKey") {
                	i++;
			assert(i<argc);
			args.maxKey=atoi(argv[i]);
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
	
	generateKeys(args);
	generateWorkload(args);
	args.close();
	return 0;
}
