## Render Benchmark — `5688810`

| Grammar | Backend | Nodes | Renders/sec | Mean (ms) | Min (ms) | Max (ms) | Heap/render | Heap used | RSS |
|---------|---------|------:|------------:|----------:|---------:|---------:|------------:|----------:|----:|
| rust | js | 124 | 20,706 | 0.0483 | 0.0352 | 0.49 | +277B | +3.28MB | +1.48MB |
| rust | native | 124 | 96,386 | 0.0104 | 0.0057 | 0.16 | +572B | +6.77MB | +240.0KB |
| typescript | js | 108 | 20,974 | 0.0477 | 0.0364 | 0.51 | +787B | +8.11MB | +128.0KB |
| typescript | native | 108 | 89,406 | 0.0112 | 0.0063 | 0.19 | +301B | +3.10MB | +384.0KB |
| python | js | 114 | 29,192 | 0.0343 | 0.0250 | 2.17 | +156B | +1.69MB | +336.0KB |
| python | native | 114 | 108,281 | 0.0092 | 0.0053 | 0.13 | +1.3KB | +14.97MB | +15.06MB |

**rust**: native 4.65x faster
**typescript**: native 4.26x faster
**python**: native 3.71x faster
