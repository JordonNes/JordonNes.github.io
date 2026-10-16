import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {build,strictRows}=createRequire(import.meta.url)('../damilola-gavavi/dg-model-release.js');
const dir='damilola-gavavi/data',reports=[];
const engine=await Promise.all(['dg-model-release.js','dg-15m-independent-audit.js','dg-15m-calibration.js'].map(p=>fs.readFile('damilola-gavavi/'+p,'utf8')));
const engineHash=createHash('sha256').update(JSON.stringify(engine)).digest('hex');
for(const series of ['KXBTC15M','KXGOLD15M','KXSILVER15M']){
 const dataset=JSON.parse(await fs.readFile(dir+'/15m-'+series+'.json','utf8')),rows=dataset.examples||[],artifact=build(rows,series);
 const strict=strictRows(rows,series).accepted;
 artifact.source_dataset_sha256=createHash('sha256').update(JSON.stringify(rows)).digest('hex');
 artifact.frozen_training_sha256=createHash('sha256').update(JSON.stringify(strict.filter(r=>artifact.training_tickers.includes(r.ticker)))).digest('hex');
 artifact.engine_sha256=engineHash;
 artifact.artifact_id=artifact.model_version+'-'+series+'-'+createHash('sha256').update(JSON.stringify({engine:engineHash,training:artifact.frozen_training_sha256,selected:artifact.selected_model})).digest('hex').slice(0,20);
 artifact.built_at_utc=new Date().toISOString();
 await fs.writeFile(dir+'/model-release-'+series+'.json',JSON.stringify(artifact,null,2)+'\n');reports.push(artifact);
 console.log(JSON.stringify({series,state:artifact.state,strict_rows:artifact.strict_verified_rows,rejections:artifact.rejection_counts,selected:artifact.selected_model,holdout:artifact.locked_holdout.holdout_samples,improvement:artifact.locked_holdout.holdout_improvement_brier,interval:artifact.locked_holdout.improvement_95pct_block_interval}));
}
const summary=['# Damilola versioned model release check','Strict paired quotes and independently verified settlement timestamps only. No close-time substitution. Final 100 contracts held out chronologically; model selection uses earlier resolved data.', '| Series | Verified rows | Rejected | Selected model | Gate |','|---|---:|---:|---|---|',...reports.map(r=>`| ${r.series_ticker} | ${r.strict_verified_rows} | ${r.rejected_rows} | ${r.selected_model||'insufficient data'} | ${r.state} |`),'','Blocked means no model deployment. Passing is research-only and does not establish prospective skill, executable fills or net profit.'].join('\n');
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
