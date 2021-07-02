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
#include <set>
#include <map>

typedef int keytype;
typedef std::string valtype;

//These are the parameters used to generate the data file and workload file
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
        unsigned int skewBoundary;
        unsigned int rangeLength;
        double skewProb;
        bool isUniform;
        bool permuteWorkload;
        keytype maxKey;
        std::ofstream bulkdata;
        std::ofstream workload;
        //Default values which can also be entered by the user 
        params() {
            numKeys=1000*1000*10;
            numPointLookups=10;
            numZeroResultPointLookups=10;
            numInserts=10;
            numBlindUpdates=10;
            numReadModifyUpdates=10;
            numNonEmptyRangeLookups=10;
            numEmptyRangeLookups=10;
            skewBoundary=1000;
            rangeLength=100;
            skewProb=0.5;
            isUniform=true;
            permuteWorkload=false;
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

//These are the commands the user can use in the command line to change the value of the parameters from the defaults
void help() {
    std::string s[]={
        "-skew",
        "-n numKeys",
        "-l numPointLookups",
        "-z numZeroResultPointLookups",
        "-i numInserts",
        "-u numBlindUpdates",
        "-w numReadModifyUpdates",
        "-r numNonEmptyRangeLookups",
        "-e numEmptyRangeLookups",
        "-m maxKey",
        "-s skewBoundary",
        "-p skewProbability",
        "-rl rangeLength",
        "-permute"
    };
    for(auto str:s) {
        std::cout << '\t' << str << '\n';
    }

}

enum distrib_enum {dUniform, dSkew};

template <typename T>
class random_numbers {
    std::mt19937 gen;
    /*
       If doing uniform distribution, use distribU on entire range.
       If doing skew distribution, use choose_distrib to pick between distrib1 and distrib2, set to the skew ranges
     */
    std::uniform_int_distribution<T> distribU;
    std::uniform_int_distribution<T> distrib1;
    std::uniform_int_distribution<T> distrib2;
    std::binomial_distribution<> choose_distrib;
    distrib_enum distrib_type;

    //Class takes the lower and upper bounds, the probability of choosing between the skewed ranges,
    //the divider of the skewed ranges, and whether or not it is a skew distribution,
    //with the last three values having defaults to make it easy to create a uniform distribution which does not need any of them.
    public:
    random_numbers(T lo, T hi, double skewProb = 0.5, T bound = 0, bool isUniform = true) : distribU(lo, hi),
    distrib1(lo, std::max(lo, bound)),
    distrib2(std::min(bound, hi), hi),
    choose_distrib(1, skewProb), 
    gen(get_generator()) 
    {
        if (isUniform) {
            distrib_type=dUniform;   
        }
        else {
            distrib_type=dSkew;
        }
    }

    //FIXME is it okay to reuse gen for all three distributions when skew

    std::mt19937 get_generator() {
        std::random_device rd;
        std::mt19937 gen(rd());
        return gen;
    }

    T get_random() {
        if (distrib_type==dUniform) {
            return distribU(gen);
        }
        else { //skew
            int choice=choose_distrib(gen);
            if (choice==0) {
                return distrib1(gen);
            }
            else {
                return distrib2(gen);
            }
        }
    }
};

std::vector<keytype> keys;
std::set<keytype> keys_set;
std::vector<valtype> values;

//Generates the appropriate number of key value pairs to fill the data file
void generateKeys(params& args) {

    random_numbers<keytype> key_gen(-args.maxKey, args.maxKey, args.skewProb, args.skewBoundary, args.isUniform);

    keys.reserve(args.numKeys);
    values.reserve(args.numKeys);

    for (int i=0; i<args.numKeys; i++) {
        keytype key=key_gen.get_random();
        while(keys_set.find(key) != keys_set.end()) { //finds unique key
            key=key_gen.get_random();
        }
        valtype val = "AAAAAAAAAAA"; //default value. Values aren't actually used
        keys.push_back(key);
        keys_set.insert(key);
        values.push_back(val);
        args.bulkdata << key << " " << val <<std::endl;
    }
}

//Generates a workload file consisting of operation codes and the corresponding actions associated with the operation
void generateWorkload(params& args) {
    std::vector<char> op_order(args.num_ops());

    //Begins by creating a list of the operations the number of times it should appear 
    //and then takes a permutation of that list so they are in a random order
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

    if (args.permuteWorkload) {
        //generates random permutation 
        std::shuffle(op_order.begin(), op_order.end(), g);
    }

    //Generates a random index for an existing key, including the keys that are added by inserts
    //Uses of this random number generator check that the index generated exists at that time
    random_numbers<keytype> old_keys(0, args.numKeys-1+args.numInserts);

    random_numbers<keytype> new_keys(-args.maxKey, args.maxKey, args.skewProb, args.skewBoundary, args.isUniform);

    //Subtracting off range length to ensure the range lies completely within the key range
    random_numbers<keytype> range_start(-args.maxKey, args.maxKey-args.rangeLength);

    unsigned int rangeFailures=0;

    for(int i=0; i<op_order.size(); i++) {
        char op=op_order[i];
        switch(op) {
            //Point lookups and zero result point lookups only need a key
            case 'l':
            case 'z': 
                {
                    unsigned int index = 0;
                    do {
                        index = old_keys.get_random();
                    } while (index>=keys.size());
                    args.workload << op  << ' ' << keys[index] << '\n';
                    break;
                }
                //Inserts find a new key and add it and a value to the list
            case 'i': 
                {
                    keytype new_key;
                    bool isNew=false;
                    do {
                        new_key=new_keys.get_random();
                        if (keys_set.find(new_key)==keys_set.end()) {
                            isNew=true;
                        }
                    } while(!isNew);
                    valtype val = "AAAAAAAAAAA"; //default value. Values aren't actually used
                    keys.push_back(new_key);
                    keys_set.insert(new_key);
                    values.push_back(val);
                    args.workload << op << ' ' << new_key << ' ' << val << '\n';
                    break;
                }
                //Blind updates find an old key and change the value, but values aren't used in this program so it is a default
            case 'u':
                {
                    unsigned int index = 0;
                    do {
                        index = old_keys.get_random();
                    } while (index>=keys.size());
                    valtype val = "AAAAAAAAAAA"; //default value. Values aren't actually used
                    args.workload << op  << ' ' << keys[index] << ' ' << val << '\n';
                }
                break;
                //Read modify updates find an old key and increment the value, but values aren't use in this program so it is a default
            case 'w':
                {
                    unsigned int index = 0;
                    do {
                        index = old_keys.get_random();
                    } while (index>=keys.size());
                    valtype incremented_val = "BBBBBBBBBB"; //Incremented value is default string of B's rather than A's now
                    args.workload << op  << ' ' << keys[index] << ' ' << incremented_val << '\n';
                }
                break;
                //Non empty range queries finds a range of keys where at least one of the indices is an existing key 
            case 'r':
                {
                    keytype rangeS;
                    bool foundRange=false;
                    do {
                        rangeS = range_start.get_random();
                        keytype rangeE = rangeS + args.rangeLength;
                        for (keytype i=rangeS; i<rangeE; i++) {
                            if (keys_set.find(i)!=keys_set.end()) {
                                foundRange=true;
                            }
                        }
                    } while(!foundRange);
                    args.workload << op << ' ' << rangeS << ' ' << args.rangeLength << '\n';
                }
                break;
                //Empty range queries finds a range of keys where none of them are used, printing an error message if no ranges can be found
            case 'e':
                {
                    keytype rangeS;
                    bool foundRange=true;
                    int tries=0;
                    int maxTries=10 + args.maxKey/100; //max number of tries is at least 10 and is a function of the size of the key space
                    do {
                        tries++;
                        rangeS = range_start.get_random();
                        keytype rangeE = rangeS + args.rangeLength;
                        for (keytype i=rangeS; i<rangeE; i++) {
                            if (keys_set.find(i)!=keys_set.end()) {
                                foundRange=false;
                            }
                        }
                    } while(foundRange && tries < maxTries);
                    if (foundRange) {
                        args.workload << op << ' ' << rangeS << ' ' << args.rangeLength << '\n';
                    }
                    else {
                        rangeFailures++;
                    }
                }
                break;
            default: 
                assert(0); //should not happen
                break;

        } //switch
    } //for
    if (rangeFailures != 0) {
        std::cout << "Empty range could not be found " << rangeFailures << " times\n";
    }
}

int main(int argc, char* argv[]) {

    params args;

    //Parses the commands the user enters and updates the parameters as necessary
    for(int i=1; i<argc; i++) {
        std::string p=argv[i];
        if (p=="-skew") {
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
        else if (p=="-m") {
            i++;
            assert(i<argc);
            args.maxKey=atoi(argv[i]);
        }
        else if (p=="-s") {
            i++;
            assert(i<argc);
            args.skewBoundary=atoi(argv[i]);
        }
        else if (p=="-p") {
            i++;
            assert(i<argc);
            args.skewProb=atof(argv[i]);
        }
        else if (p=="-rl") {
            i++;
            assert(i<argc);
            args.rangeLength=atoi(argv[i]);
        }
        else if (p=="-permute") {
            args.permuteWorkload=true;
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

    //Generates the data and workload files
    generateKeys(args);
    generateWorkload(args);
    args.close();
    return 0;
}
