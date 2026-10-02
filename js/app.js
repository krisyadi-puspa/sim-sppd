const SECS={dash:'Dashboard',ajuan:'Pengajuan SPPD',st:'Surat Tugas',laporan:'Laporan Perjalanan',biaya:'Biaya & LPJ',arsip:'Arsip Digital',stat:'Analitik',master:'Master Data'};
const GRP={dash:'MENU UTAMA',ajuan:'MENU UTAMA',st:'MENU UTAMA',laporan:'PROSES PERJALANAN',biaya:'PROSES PERJALANAN',arsip:'DATA & ADMINISTRASI',stat:'DATA & ADMINISTRASI',master:'DATA & ADMINISTRASI'};
const ICO={dash:'▦',ajuan:'✎',st:'✉',laporan:'☰',biaya:'Rp',arsip:'🗂',stat:'📊',master:'⚙'};
const ROLE={Admin:'dash ajuan st laporan biaya arsip stat master',Sekretaris:'dash ajuan st laporan biaya arsip stat','Kepala Desa':'dash ajuan st laporan biaya arsip stat',Pelaksana:'dash ajuan st laporan biaya arsip',Bendahara:'dash biaya arsip stat'};
const nr=x=>{x=String(x||'').toLowerCase();return x.includes('admin')?'Admin':x.includes('sekret')?'Sekretaris':x.includes('bendahara')||x.includes('keuangan')?'Bendahara':x.includes('pelaksana')?'Pelaksana':x.includes('kepala')||x.includes('kades')?'Kepala Desa':''};
const okS=s=>!!(s&&s.me&&Array.isArray(s.pengajuan)&&s.biaya&&ROLE[nr(s.me.role)]);
window.onerror=m=>toast('Error: '+m,1);
let S=LS('st'),tok=localStorage.getItem('tok'),box=LS('box')||[],cur='dash',busy=false,tmr,qt,q='';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID'),sum=(a,k)=>a.reduce((s,x)=>s+Number(x[k]||0),0);
const tgl=d=>d?new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'-';
const days=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5)+1;
const toast=(m,e)=>{const t=$('toast');t.textContent=m;t.className='show'+(e?' err':'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='',3500)};
const store=()=>{localStorage.setItem('st',JSON.stringify(S));localStorage.setItem('box',JSON.stringify(box))};
const sat=['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];
function tb(n){n=Math.floor(n);if(n<12)return sat[n];if(n<20)return tb(n-10)+' belas';if(n<100)return tb(n/10|0)+' puluh '+tb(n%10);if(n<200)return 'seratus '+tb(n-100);if(n<1e3)return tb(n/100|0)+' ratus '+tb(n%100);if(n<2e3)return 'seribu '+tb(n-1e3);if(n<1e6)return tb(n/1e3|0)+' ribu '+tb(n%1e3);if(n<1e9)return tb(n/1e6|0)+' juta '+tb(n%1e6);return tb(n/1e9|0)+' miliar '+tb(n%1e9)}
const terbilang=n=>((n?tb(n):'nol').replace(/\s+/g,' ').trim()+' rupiah').replace(/(^|\s)\S/g,c=>c.toUpperCase());

// ---- Optimistic UI: update lokal instan, sinkron batch di latar belakang ----
function local(o){const p=S.pengajuan.find(x=>x.id===o.id),r=S.me.role;
 if(o.action==='ajukan'){S.pengajuan.unshift({...o,id:o.tmp,nama:S.me.nama,email:S.me.email,status:'Diajukan',estimasi:days(o.berangkat,o.kembali)*S.biaya.uang_harian+o.jarak_km*S.biaya.transport_km});return}
 if(!p)return;
 if(o.action==='putuskan')p.status=o.aksi==='tolak'?'Ditolak':r==='Kepala Desa'?'Disetujui':'Diverifikasi';
 if(o.action==='laporan'){p.laporan=JSON.stringify(o.laporan);p.status_laporan='Diajukan'}if(o.action==='putuskanLaporan')p.status_laporan=o.aksi==='setuju'?'Terkonfirmasi':'Revisi';if(o.action==='realisasi'){p.realisasi=o.total;p.status_biaya='Diajukan'}
 if(o.action==='verifBiaya')p.status_biaya=o.aksi==='setuju'?'Lunas':'Revisi'}
function act(op,msg){box.push(op);local(op);store();draw();toast(msg);clearTimeout(tmr);tmr=setTimeout(sync,400)}
async function sync(){
 if(busy)return;busy=true;const sent=box.slice(),el=$('sync');el.textContent='● menyinkron...';
 try{const r=await api({token:tok,ops:sent});
  if(r.code===401){busy=false;return logout()}
  if(!r.success)throw Error(r.message);
  box=box.slice(sent.length);if(!okS(r.state))throw Error('Respons server tidak valid');S=r.state;S.me.role=nr(S.me.role);(r.results||[]).forEach(x=>{if(!x.ok)toast(x.message,1)});
  store();draw();el.textContent='● tersinkron'}
 catch(e){el.textContent='● offline';if(sent.length)toast('Offline: tersimpan di perangkat, akan disinkronkan otomatis')}
 busy=false;if(box.length)setTimeout(sync,5000)}
function logout(){['tok','st','box'].forEach(k=>localStorage.removeItem(k));location.reload()}

// ---- Render ----
const pill=s=>`<span class="pill s-${esc(s||'Diajukan')}">${esc(s||'-')}</span>`;
function acts(p){const r=S.me.role,a=[],b=(l,f,c='')=>a.push(`<button class="btn sm ${c}" data-a="${f}" data-id="${esc(p.id)}">${l}</button>`);
 if(['Sekretaris','Admin'].includes(r)&&p.status==='Diajukan'){b('Verifikasi','v');b('Tolak','t','ghost')}
 if(r==='Kepala Desa'&&p.status==='Diverifikasi'){b('Setujui ST','v');b('Tolak','t','ghost')}
 if(p.status==='Disetujui'){b('Lihat ST','st','ghost');if(r==='Pelaksana'&&(!p.realisasi||p.status_biaya==='Revisi'))b('Isi Biaya','bi')}
 if(r==='Bendahara'&&p.status_biaya==='Diajukan'){b('Setujui Biaya','vb');b('Revisi','rb','ghost')}
 if(p.status_biaya==='Lunas')b('Tanda Terima','tt','ghost');
 return a.join('')}
const tbl=L=>L.length?`<div class="tw"><table><thead><tr><th>No / ID<th>Petugas<th>Maksud & Tujuan<th>Tanggal<th>Estimasi<th>Realisasi<th>Status<th></thead><tbody>${L.map(p=>`<tr><td class="n">${esc(p.no_st||p.id)}<td>${esc(p.nama)}<td>${esc(p.maksud)}<br><small>${esc(p.lokasi)}</small><td class="n">${tgl(p.berangkat)}<br><small>s.d. ${tgl(p.kembali)}</small><td class="n">${rp(p.estimasi)}<td class="n">${p.realisasi?rp(p.realisasi):'-'}<td>${pill(p.status)} ${p.status_biaya?pill(p.status_biaya):''}${p.alasan?`<br><small>${esc(p.alasan)}</small>`:''}<td>${acts(p)}`).join('')}</tbody></table></div>`:'<p class="em">Belum ada data.</p>';
const fl=()=>S.pengajuan.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
const sec={
 dash(){const P=S.pengajuan,n=s=>P.filter(x=>x.status===s).length,R=P.filter(x=>x.realisasi),est=sum(R,'estimasi'),rl=sum(R,'realisasi'),pc=est?Math.min(100,rl/est*100):0;
  return `<h2>Selamat datang, ${esc(S.me.nama)}</h2><div class="grid"><div class="card"><small>MENUNGGU VERIFIKASI</small><b class="big">${n('Diajukan')}</b></div><div class="card"><small>MENUNGGU APPROVAL KADES</small><b class="big">${n('Diverifikasi')}</b></div><div class="card"><small>TOTAL PERJALANAN AKTIF</small><b class="big">${P.filter(x=>x.status!=='Ditolak').length}</b></div><div class="card"><small>REALISASI vs ESTIMASI</small><b class="big">${rp(rl)}</b><div class="bar"><i style="width:${pc}%"></i></div><small>${pc.toFixed(0)}% dari ${rp(est)}</small></div></div><h3>Terbaru</h3>${tbl(P.slice(0,8))}`},
 ajuan:()=>`<h2>Pengajuan SPPD</h2>${tbl(S.pengajuan)}`,
 st:()=>`<h2>Surat Tugas</h2>${tbl(S.pengajuan.filter(x=>x.no_st))}`,
 biaya:()=>`<h2>Biaya & LPJ</h2>${tbl(S.pengajuan.filter(x=>x.status==='Disetujui'))}`,
  laporan(){const L=S.pengajuan.filter(x=>x.status==='Disetujui'),r=S.me.role;
  return `<h2>Laporan Perjalanan</h2>${L.length?`<div class="tw"><table><thead><tr><th>No ST<th>Petugas<th>Maksud & Tujuan<th>Status Laporan<th></thead><tbody>${L.map(p=>{const b=(l,a,c='')=>`<button class="btn sm ${c}" data-a="${a}" data-id="${esc(p.id)}">${l}</button>`,x=[];
   if(r==='Pelaksana'&&(!p.status_laporan||p.status_laporan==='Revisi'))x.push(b('Isi Laporan','lp'));
   if(['Sekretaris','Admin'].includes(r)&&p.status_laporan==='Diajukan')x.push(b('Setujui','ls'),b('Revisi','lr','ghost'));
   if(p.laporan)x.push(b('Lihat','dl','ghost'));
   return `<tr><td class="n">${esc(p.no_st)}<td>${esc(p.nama)}<td>${esc(p.maksud)}<br><small>${esc(p.lokasi)}</small><td>${p.status_laporan?pill(p.status_laporan):'<span class="em">Belum dibuat</span>'}${p.status_laporan==='Revisi'&&p.alasan?`<br><small>${esc(p.alasan)}</small>`:''}<td>${x.join('')}`}).join('')}</tbody></table></div>`:'<p class="em">Belum ada perjalanan yang disetujui.</p>'}`},
 master(){const t=(h,R)=>`<div class="tw"><table style="min-width:0"><thead><tr>${h.map(x=>`<th>${x}`).join('')}</thead><tbody>${R.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}`).join('')}`).join('')}</tbody></table></div>`;
  return `<div class="grid2"><div><h3>Master Aparatur</h3>${t(['NIPD','Nama','Jabatan','Gol'],(S.aparatur||[]).map(a=>[a.nipd,a.nama,a.jabatan,a.golongan]))}</div><div><h3>Pengguna & Peran</h3>${t(['Email','Nama','Peran'],(S.users||[]).map(a=>[a.email,a.nama,a.role]))}</div></div>`},
  arsip:()=>`<h2>Arsip Digital</h2><div class="row" style="margin:0 0 1rem"><input id="q" placeholder="Cari nama, tujuan, status..." value="${esc(q)}"><button class="btn ghost" data-a="csv">Ekspor CSV</button></div><div id="ta">${tbl(fl())}</div>`,
 stat(){const P=S.pengajuan,by=f=>P.reduce((m,x)=>{const k=f(x)||'-';m[k]=(m[k]||0)+1;return m},{}),bars=o=>{const mx=Math.max(1,...Object.values(o));return Object.entries(o).sort().map(([k,v])=>`<div class="br"><span>${esc(k)}</span><div class="bar"><i style="width:${v/mx*100}%"></i></div><b>${v}</b></div>`).join('')||'<p class="em">Belum ada data.</p>'};
  return `<h2>Analitik</h2><div class="grid2"><div class="card"><h3>Status Pengajuan</h3>${bars(by(x=>x.status))}</div><div class="card"><h3>Perjalanan per Bulan</h3>${bars(by(x=>(x.berangkat||'').slice(0,7)))}</div><div class="card"><h3>Per Petugas</h3>${bars(by(x=>x.nama))}</div></div>`}};
const bdg=k=>{const r=S.me.role,P=S.pengajuan,c=k==='ajuan'?(['Sekretaris','Admin'].includes(r)?P.filter(x=>x.status==='Diajukan').length:r==='Kepala Desa'?P.filter(x=>x.status==='Diverifikasi').length:0):k==='biaya'&&r==='Bendahara'?P.filter(x=>x.status_biaya==='Diajukan').length:0;return c?`<span class="bdg">${c}</span>`:''};
function draw(){const al=ROLE[S.me.role].split(' ');if(!al.includes(cur))cur=al[0];
 $('meN').textContent=S.me.nama;$('meR').textContent=S.me.role;
 let g='';$('nav').innerHTML=al.map(k=>{const h=GRP[k]!==g?`<div class="gh">${g=GRP[k]}</div>`:'';return h+`<a data-g="${k}">${ICO[k]} ${SECS[k]}${bdg(k)}</a>`}).join('');
 al.forEach(k=>$('c-'+k).innerHTML=sec[k]());show()}
function show(){document.querySelectorAll('.sec').forEach(s=>s.classList.toggle('on',s.id==='s-'+cur));document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.g===cur));$('ttl').textContent=SECS[cur]}
const go=k=>{cur=k;show();$('side').classList.remove('open')};  // navigasi SPA 0ms
const fm=()=>['Pelaksana','Admin'].includes(S.me.role)?`<form id="fm" class="card"><h3>Pengajuan Baru</h3><div class="fg"><label>Maksud / Tujuan Kegiatan<input name="maksud" required></label><label>Lokasi Tujuan<input name="lokasi" required></label><label>Jarak pergi-pulang (km)<input name="jarak_km" type="number" min="0" required></label><label>Dasar (Surat / Undangan)<input name="dasar" required></label><label>Berangkat<input name="berangkat" type="date" required></label><label>Kembali<input name="kembali" type="date" required></label></div><p id="est" class="est"></p><button class="btn">Ajukan</button></form>`:'';
function est(){const f=$('fm');if(!f)return;const v=Object.fromEntries(new FormData(f)),d=days(v.berangkat,v.kembali);$('est').textContent=d>=1?`Estimasi: ${d} hari × ${rp(S.biaya.uang_harian)} + ${v.jarak_km||0} km × ${rp(S.biaya.transport_km)} = ${rp(d*S.biaya.uang_harian+(+v.jarak_km||0)*S.biaya.transport_km)}`:''}

// ---- Dokumen cetak (Ctrl+P → Simpan sebagai PDF) ----
const doc=h=>{$('dlg').innerHTML=h+'<div class="row noprint"><button class="btn" data-a="pr">Cetak / Simpan PDF</button><button class="btn ghost" data-a="x">Tutup</button></div>';$('dlg').showModal()};
const docST=p=>doc(`<div class="kop"><b>PEMERINTAH KABUPATEN TASIKMALAYA</b><br>KECAMATAN PUSPAHIANG<br><b>KANTOR KEPALA DESA PUSPAHIANG</b></div><h3 class="c"><u>SURAT TUGAS</u></h3><p class="c">Nomor: ${esc(p.no_st||'(menunggu sinkron)')}</p><table class="kv"><tr><td>DASAR<td>:<td>${esc(p.dasar)}<tr><td>MENUGASKAN<td>:<td>Nama: <b>${esc(p.nama)}</b><br>NIPD: ${esc(p.nipd||'-')}<br>Jabatan: ${esc(p.jabatan||'-')}<tr><td>UNTUK<td>:<td>1. ${esc(p.maksud)} di ${esc(p.lokasi)}, ${tgl(p.berangkat)} s.d. ${tgl(p.kembali)}.<br>2. Segala biaya yang timbul dibebankan pada APBDesa.<br>3. Melaporkan hasil pelaksanaan tugas kepada Kepala Desa Puspahiang.<tr><td>ALAT ANGKUT<td>:<td>Kendaraan Dinas</table><div class="ttd">Ditetapkan di Puspahiang<br>Kepala Desa Puspahiang,<br><br><br><b><u>${DESA.kades}</u></b></div><p class="sm">Tembusan: 1. Yth. Ketua BPD Desa Puspahiang 2. Arsip</p>`);
const docTT=p=>doc(`<div class="kop"><b>TANDA TERIMA PEMBAYARAN BIAYA PERJALANAN DINAS</b><br>DESA PUSPAHIANG KECAMATAN PUSPAHIANG<br>TAHUN ANGGARAN ${new Date(p.berangkat).getFullYear()}</div><div class="tw"><table style="min-width:0"><tr><th>No<th>Nama<th>Jabatan<th>NIPD<th>Jumlah (Rp)<th>Tanda Tangan<tr><td>1<td>${esc(p.nama)}<td>${esc(p.jabatan||'-')}<td class="n">${esc(p.nipd||'-')}<td class="n">${rp(p.realisasi)}<td><tr><th colspan="4">Total<th class="n">${rp(p.realisasi)}<th></table></div><p>Terbilang: <b><i>## ${terbilang(p.realisasi)} ##</i></b></p><div class="grid" style="text-align:center;margin-top:1rem"><div>Mengetahui<br>Kepala Desa<br><br><br><b><u>${DESA.kades}</u></b></div><div>Lunas Bayar Tgl ${tgl(p.tgl_bayar)}<br>Kaur Keuangan<br><br><br><b><u>${DESA.bendahara}</u></b><br>NIPD ${DESA.bendaharaNipd}</div><div>Pembuat Daftar<br>Kaur TU & Umum<br><br><br><b><u>${DESA.pembuat}</u></b><br>NIPD ${DESA.pembuatNipd}</div></div><p class="c sm">Puspahiang, ${tgl(p.tgl_bayar)}</p>`);
function formBiaya(p){$('dlg').innerHTML=`<h3>Realisasi Biaya — ${esc(p.id)}</h3><p>Estimasi ${rp(p.estimasi)} · batas maksimum 110% = <b>${rp(p.estimasi*1.1)}</b></p><label>Total realisasi (Rp)<input id="rt" type="number" min="1"></label><label>Link bukti (foto/scan kuitansi di Drive)<input id="rbk"></label><div class="row"><button class="btn" data-a="sv" data-id="${esc(p.id)}">Kirim</button><button class="btn ghost" data-a="x">Batal</button></div>`;$('dlg').showModal()}

const mf=()=>`<h2>Master Data</h2><div class="grid2"><form id="fa" class="card"><h3>Tambah Aparatur</h3><label>NIPD<input name="nipd" required></label><label>Nama<input name="nama" required></label><label>Jabatan<input name="jabatan"></label><label>Golongan<input name="golongan"></label><label>Email akun terkait<input name="email" type="email"></label><button class="btn">Simpan</button></form><form id="fu" class="card"><h3>Tambah Pengguna</h3><label>Email<input name="email" type="email" required></label><label>Nama<input name="nama" required></label><label>Peran<select name="role">${Object.keys(ROLE).map(r=>`<option>${r}</option>`).join('')}</select></label><label>PIN awal (min 4)<input name="pin" type="password" minlength="4" required></label><button class="btn">Simpan</button></form></div>`;
function formLap(p){const L=p.laporan?JSON.parse(p.laporan):{};
 $('dlg').innerHTML=`<h3>Laporan Perjalanan — ${esc(p.no_st)}</h3><label>Poin hasil kegiatan (1 baris = 1 poin)<textarea id="lh" placeholder="Contoh: Pagu bantuan keuangan disetujui Rp 250.000.000"></textarea></label><button class="btn ghost sm" id="aib" data-a="ai" data-id="${esc(p.id)}">✨ Generate Draft (AI)</button><label>I. Maksud Perjalanan Dinas<textarea id="lm">${esc(L.maksud||p.maksud)}</textarea></label><label>II. Tujuan Perjalanan Dinas<textarea id="lt">${esc(L.tujuan||p.maksud)}</textarea></label><label>IV. Hasil / Kesimpulan<textarea id="lw">${esc(L.hasil||'')}</textarea></label><label>Tindak Lanjut<textarea id="ll">${esc(L.tindak||'')}</textarea></label><div class="row"><button class="btn" data-a="sl" data-id="${esc(p.id)}">Kirim Laporan</button><button class="btn ghost" data-a="x">Batal</button></div>`;$('dlg').showModal()}
async function aiGen(p){const poin=$('lh').value.trim();if(!poin)return toast('Isi poin hasil kegiatan dulu',1);const b=$('aib');b.disabled=true;b.textContent='Menyusun...';
 const j=v=>Array.isArray(v)?v.join('\n'):v;
 let h=poin.split('\n').filter(x=>x.trim()).map((x,i)=>`${i+1}. ${x.trim().replace(/^[-\d.\s]+/,'')}`).join('\n'),t='1. Menindaklanjuti hasil kegiatan dalam rapat koordinasi internal pemerintah desa.\n2. Menyampaikan laporan kepada Kepala Desa untuk arahan lebih lanjut.';
 try{const r=await api({token:tok,action:'ai',id:p.id,poin});if(r.success){h=j(r.hasil);t=j(r.tindak)}else toast(r.message||'Memakai template lokal')}catch(e){toast('Offline: memakai template lokal')}
 $('lw').value=h;$('ll').value=t;b.disabled=false;b.textContent='✨ Generate Draft (AI)'}
const docLap=p=>{const L=JSON.parse(p.laporan||'{}'),n=s=>esc(s).replace(/\n/g,'<br>');doc(`<div class="kop"><b>PEMERINTAH KABUPATEN TASIKMALAYA</b><br>KECAMATAN PUSPAHIANG<br><b>PEMERINTAH DESA PUSPAHIANG</b></div><h3 class="c">LAPORAN HASIL PERJALANAN DINAS</h3><p><b>I. Maksud Perjalanan Dinas</b><br>${n(L.maksud)}</p><p><b>II. Tujuan Perjalanan Dinas</b><br>${n(L.tujuan)}</p><p><b>III. Waktu, Tempat dan Pelaksanaan</b><br>1. Waktu: ${tgl(p.berangkat)} s.d. ${tgl(p.kembali)}<br>2. Tempat: ${esc(p.lokasi)}</p><p><b>IV. Hasil / Kesimpulan</b><br>${n(L.hasil)}</p><p><b>V. Tindak Lanjut</b><br>${n(L.tindak)}</p><p><b>VI. Penutup</b><br>Demikian laporan perjalanan dinas ini kami buat sebagai bahan pertanggungjawaban.</p><div class="grid" style="text-align:center"><div><br>Pembuat Laporan<br><br><br><b><u>${esc(p.nama)}</u></b></div><div>Puspahiang, ${tgl(new Date())}<br>Mengetahui, Kepala Desa Puspahiang<br><br><br><b><u>${DESA.kades}</u></b></div></div>`)};
// ---- Event delegation ----
document.addEventListener('click',e=>{const t=e.target.closest('[data-a],[data-g]');if(!t)return;if(t.dataset.g)return go(t.dataset.g);
 const id=t.dataset.id,a=t.dataset.a,p=S.pengajuan.find(x=>x.id===id),ask=(m,f)=>{const x=prompt(m);if(x&&x.trim())f(x.trim())};
 if(a==='v')act({action:'putuskan',id,aksi:'setuju'},'Disetujui ✔');
 else if(a==='t')ask('Alasan penolakan:',x=>act({action:'putuskan',id,aksi:'tolak',alasan:x},'Ditolak'));
 else if(a==='st')docST(p);else if(a==='tt')docTT(p);else if(a==='bi')formBiaya(p);
 else if(a==='vb')act({action:'verifBiaya',id,aksi:'setuju'},'Biaya disetujui ✔');
 else if(a==='rb')ask('Alasan revisi:',x=>act({action:'verifBiaya',id,aksi:'revisi',alasan:x},'Revisi diminta'));
 else if(a==='sv'){const total=+$('rt').value,bukti=$('rbk').value.trim();if(!(total>0)||!bukti)return toast('Total & link bukti wajib diisi',1);if(total>p.estimasi*1.1)toast('Peringatan: melebihi 110% estimasi',1);$('dlg').close();act({action:'realisasi',id,total,bukti},'Realisasi dikirim ✔')}
 else if(a==='lp')formLap(p);else if(a==='dl')docLap(p);else if(a==='ai')aiGen(p);
 else if(a==='ls')act({action:'putuskanLaporan',id,aksi:'setuju'},'Laporan dikonfirmasi ✔');
 else if(a==='lr')ask('Catatan revisi:',x=>act({action:'putuskanLaporan',id,aksi:'revisi',alasan:x},'Revisi diminta'));
 else if(a==='sl'){const L={maksud:$('lm').value,tujuan:$('lt').value,hasil:$('lw').value.trim(),tindak:$('ll').value};if(!L.hasil)return toast('Hasil kegiatan wajib diisi',1);$('dlg').close();act({action:'laporan',id,laporan:L},'Laporan dikirim ✔')}
 else if(a==='x')$('dlg').close();else if(a==='pr')print();
 else if(a==='csv'){const L=fl(),k=Object.keys(L[0]||{}),c=v=>'"'+String(v??'').replace(/"/g,'""')+'"',b=new Blob(['\ufeff'+[k.map(c).join(',')].concat(L.map(r=>k.map(x=>c(r[x])).join(','))).join('\n')],{type:'text/csv'}),l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='arsip-sppd.csv';l.click()}});
document.addEventListener('input',e=>{if(e.target.closest('#fm')){est();localStorage.setItem('draft',JSON.stringify(Object.fromEntries(new FormData($('fm')))))}
 else if(e.target.id==='q'){clearTimeout(qt);qt=setTimeout(()=>{q=e.target.value;$('ta').innerHTML=tbl(fl())},200)}});  // debounce + filter lokal
document.addEventListener('submit',e=>{const fid=e.target.id;
 if(fid==='fa'||fid==='fu'){e.preventDefault();const rec=Object.fromEntries(new FormData(e.target)),t=fid==='fa'?'aparatur':'user';S.aparatur=S.aparatur||[];S.users=S.users||[];t==='aparatur'?S.aparatur.push(rec):S.users.push({email:rec.email,nama:rec.nama,role:rec.role});act({action:'master',tab:t,rec},'Tersimpan ✔');e.target.reset();return}
 if(fid!=='fm')return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target));
 if(days(v.berangkat,v.kembali)<1)return toast('Tanggal kembali tidak boleh sebelum berangkat',1);
 v.jarak_km=+v.jarak_km;act({action:'ajukan',tmp:'TMP-'+Date.now(),...v},'Pengajuan terkirim ✔');e.target.reset();localStorage.removeItem('draft');est()});
$('burger').onclick=()=>$('side').classList.toggle('open');$('out').onclick=logout;
$('lf').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;
 try{const r=await api({action:'login',email:$('em').value,pin:$('pn').value});if(!r.success)throw Error(r.message);
  tok=r.token;localStorage.setItem('tok',tok);const s=await api({token:tok,ops:[]});if(!s.success||!okS(s.state))throw Error(s.message||'Peran akun tidak valid di tab User_Akses');S=s.state;store();boot()}
 catch(x){toast(x.message==='Failed to fetch'?'Gagal terhubung ke server. Cek GAS_URL.':x.message,1)}b.disabled=false};
function boot(){S.me.role=nr(S.me.role);
 $('main').innerHTML=ROLE[S.me.role].split(' ').map(k=>`<section id="s-${k}" class="sec">${k==='ajuan'?fm():k==='master'?mf():''}<div id="c-${k}"></div></section>`).join('');
 const d=LS('draft'),f=$('fm');if(d&&f){Object.entries(d).forEach(([k,v])=>f.elements[k]&&(f.elements[k].value=v));est()}
 draw();$('login').hidden=true;$('app').hidden=false;sync()}  // render instan dari cache lokal, lalu segarkan di latar belakang
if(tok&&okS(S)){try{boot()}catch(e){logout()}}
