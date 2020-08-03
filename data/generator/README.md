This file can be used both for generating data and workload of the demo. 

You can compile with compile with g++ -O3 -o workload workload.cc 

There are different ways to run it.
 1. ./workload 0  - this simply generates 10000000 entries with keys between -2147483648 and 2147483648 and values less than 10000 with uniform distribution.
 2. ./workload 1 - this does the same but with skew distribution.

If you want to play around with these settings, you can either change it in the file or follow either of the two following ways.
 3. ./workload 0 1000000 100000 100000 10000000000 - Here the format is <workload_type>, <#data>, <#gets>, <#puts>, <max_U> where workload_type = 0 for uniform, 1 for skew, max_U is the maximum value allowed for keys
 4. ./workload 1 1000000 10000 10000 100000 100000000 0.3 0.1 - Here the format is <workload_type>, <#data>, <#gets>, <#puts>, <U_1,U_2,p_put,p_get> This I can explain in our next meeting. In fact we will need this for your workload section of demo.

After running it it generates 2 files - bulkwrite.txt (for populating data) and workload.txt (for gets and puts).