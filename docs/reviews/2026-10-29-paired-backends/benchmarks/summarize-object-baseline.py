from pathlib import Path
import json, statistics, random
here=Path(__file__).resolve().parent
median=statistics.median
rng=random.Random(20261029)
def interval(values):
    draws=sorted(median(rng.choices(values,k=len(values))) for _ in range(5000))
    return [draws[int(.025*len(draws))], draws[int(.975*len(draws))]]
def stats(master, feature):
    ratios=[f/m for f,m in zip(feature,master)]
    return {'masterMs':median(master),'featureMs':median(feature),'featureOverMaster':median(ratios),'pairedRatios':ratios,'bootstrap95Range':interval(ratios),'masterProcessMedians':master,'featureProcessMedians':feature}
corpus=[];profiles=set();
for grammar in ['python','rust','typescript','regex','scm']:
    versions={v:[json.loads((here/f'corpus-{grammar}-{v}-{r}.json').read_text()) for r in range(5)] for v in ['master','feature']}
    sig=versions['master'][0]['signature']
    assert all(x['signature']==sig for vs in versions.values() for x in vs)
    profiles.update(x['buildProfile'] for vs in versions.values() for x in vs)
    corpus.append({'grammar':grammar,'signature':sig,'timings':{phase:stats([median(s[phase] for s in x['samples']) for x in versions['master']],[median(s[phase] for s in x['samples']) for x in versions['feature']]) for phase in ['parseMs','renderMs','pipelineMs','editMs']}})
construction=[]
for n in [2000,8000]:
  for reuse in [False,True]:
    data={}
    for v in ['master','feature']:
      data[v]=[]
      for r in range(5):
        d=json.loads((here/f'timing-rust-{v}-{r}.json').read_text());profiles.add(d['buildProfile'])
        data[v].append([s for s in d['samples'] if s['n']==n and s['reuse']==reuse])
    assert all(len(x)==7 for vs in data.values() for x in vs)
    assert len({s['renderSha256'] for vs in data.values() for xs in vs for s in xs})==1
    assert len({s['editedSha256'] for vs in data.values() for xs in vs for s in xs})==1
    construction.append({'functionRoots':n,'reusedName':reuse,'timings':{phase:stats([median(s[phase] for s in x) for x in data['master']],[median(s[phase] for s in x) for x in data['feature']]) for phase in ['buildMs','renderMs','pipelineMs','editMs']}})
memory={}
for v in ['master','feature']:
  ds=[json.loads((here/f'memory-rust-{v}-{r}.json').read_text()) for r in range(3)]
  memory[v]={'retainedFunctionRoots':32000,'samples':[d['samples'][0] for d in ds], 'medianDeltaBytes':{key:median(d['samples'][0]['delta'][key] for d in ds) for key in ['heapUsed','external','arrayBuffers','rss']},'medianAfterHeapPlusExternalBytes':median(d['samples'][0]['after']['heapUsed']+d['samples'][0]['after']['external'] for d in ds), 'medianDeltaHeapPlusExternalBytes':median(d['samples'][0]['delta']['heapUsed']+d['samples'][0]['delta']['external'] for d in ds), 'builtMemory':[d.get('builtMemory') for d in ds]}
assert len(profiles)==1
result={'master':'7471447a24febcdae6f37b025cdb80a12a929209','featureBase':'8143ccafaad9a76dc39b37d688b07dfd4cf95b7b','featureUncommitted':True,'buildProfiles':list(profiles),'freshProcesses':66,'corpus':corpus,'construction':construction,'memory':memory,'limits':['Five alternating process pairs; process medians rather than treating inner batches as independent samples.','Bootstrap ranges describe this local sample, not a guaranteed bound or an enforced acceptance threshold.','Timing includes ordinary GC; no forced GC in timing workers. Memory is a separate forced-GC retained-population experiment.','No compilers or tests from this task ran concurrently; unrelated machine activity was not controlled.','The Python built-module list setter refused its built statement input identically on both versions in the initial fixture; preserved separately and not counted as successful edit coverage.']}
(here/'object-benchmark-summary.json').write_text(json.dumps(result,indent=2)+'\n')
for row in corpus:print(row['grammar'],{k:round(v['featureOverMaster'],3) for k,v in row['timings'].items()})
for row in construction:print(row['functionRoots'],row['reusedName'],{k:round(v['featureOverMaster'],3) for k,v in row['timings'].items()})
for v in memory:print(v,'retained heap+external MiB',round(memory[v]['medianDeltaHeapPlusExternalBytes']/2**20,3))
