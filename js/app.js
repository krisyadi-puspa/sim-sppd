const SECS={dash:'Dashboard',ajuan:'Pengajuan SPPD',st:'Surat Tugas',laporan:'Laporan Perjalanan',biaya:'Biaya & LPJ',tt:'Tanda Terima',arsip:'Arsip Digital',stat:'Analitik',master:'Master Data'};
const GRP={dash:'MENU UTAMA',ajuan:'MENU UTAMA',st:'MENU UTAMA',laporan:'PROSES PERJALANAN',biaya:'PROSES PERJALANAN',tt:'PROSES PERJALANAN',arsip:'DATA & ADMINISTRASI',stat:'DATA & ADMINISTRASI',master:'DATA & ADMINISTRASI'};
const ICO={dash:'▦',ajuan:'✎',st:'✉',laporan:'☰',biaya:'Rp',tt:'🧾',arsip:'🗂',stat:'📊',master:'⚙'};
const ROLE={Admin:'dash ajuan st laporan biaya tt arsip stat master',Sekretaris:'dash ajuan st laporan biaya tt arsip stat','Kepala Desa':'dash ajuan st laporan biaya arsip stat',Pelaksana:'dash ajuan st laporan biaya arsip',Bendahara:'dash biaya tt arsip stat'};
const nr=x=>{x=String(x||'').toLowerCase();return x.includes('admin')?'Admin':x.includes('sekret')?'Sekretaris':x.includes('bendahara')||x.includes('keuangan')?'Bendahara':x.includes('pelaksana')?'Pelaksana':x.includes('kepala')||x.includes('kades')?'Kepala Desa':''};
const okS=s=>!!(s&&s.me&&Array.isArray(s.pengajuan)&&s.biaya&&ROLE[nr(s.me.role)]);
window.onerror=m=>toast('Error: '+m,1);
let S=LS('st'),tok=localStorage.getItem('tok'),box=LS('box')||[],cur='dash',busy=false,tmr,qt,q='';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID'),sum=(a,k)=>a.reduce((s,x)=>s+Number(x[k]||0),0);
const tgl=d=>d?new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'-';
const pkList=p=>String(p.pengikut||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
const days=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5)+1;
const toast=(m,e)=>{const t=$('toast');t.textContent=m;t.className='show'+(e?' err':'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='',3500)};
const store=()=>{localStorage.setItem('st',JSON.stringify(S));localStorage.setItem('box',JSON.stringify(box))};
const sat=['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];
function tb(n){n=Math.floor(n);if(n<12)return sat[n];if(n<20)return tb(n-10)+' belas';if(n<100)return tb(n/10|0)+' puluh '+tb(n%10);if(n<200)return 'seratus '+tb(n-100);if(n<1e3)return tb(n/100|0)+' ratus '+tb(n%100);if(n<2e3)return 'seribu '+tb(n-1e3);if(n<1e6)return tb(n/1e3|0)+' ribu '+tb(n%1e3);if(n<1e9)return tb(n/1e6|0)+' juta '+tb(n%1e6);return tb(n/1e9|0)+' miliar '+tb(n%1e9)}
const terbilang=n=>((n?tb(n):'nol').replace(/\s+/g,' ').trim()+' rupiah').replace(/(^|\s)\S/g,c=>c.toUpperCase());

// ---- Optimistic UI: update lokal instan, sinkron batch di latar belakang ----
function local(o){const p=S.pengajuan.find(x=>x.id===o.id),r=S.me.role;
 if(o.action==='ajukan'){S.pengajuan.unshift({...o,id:o.tmp,nama:S.me.nama,email:S.me.email,status:'Diajukan',estimasi:(1+pkList(o).length)*days(o.berangkat,o.kembali)*S.biaya.uang_harian+o.jarak_km*S.biaya.transport_km});return}
 if(!p)return;
 if(o.action==='putuskan')p.status=o.aksi==='tolak'?'Ditolak':r==='Kepala Desa'?'Disetujui':'Diverifikasi';
 if(o.action==='setLunas')p.tgl_lunas=o.tgl;if(o.action==='laporan'){p.laporan=JSON.stringify(o.laporan);p.status_laporan='Diajukan'}if(o.action==='putuskanLaporan')p.status_laporan=o.aksi==='setuju'?'Terkonfirmasi':'Revisi';if(o.action==='realisasi'){p.realisasi=o.total;p.rincian=o.rincian?JSON.stringify(o.rincian):'';p.status_biaya='Diajukan'}
 if(o.action==='verifBiaya'){p.status_biaya=o.aksi==='setuju'?'Lunas':'Revisi';if(o.aksi==='setuju'){p.tgl_bayar=new Date(Date.now()+252e5).toISOString().slice(0,10);p.tgl_lunas=o.tgl||''}}}
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
 if(p.status==='Disetujui'){b('Lihat ST','st','ghost');b('SPPD','sp','ghost');if(r==='Pelaksana'&&(!p.realisasi||p.status_biaya==='Revisi'))b('Isi Biaya','bi')}
 if(r==='Bendahara'&&p.status_biaya==='Diajukan'){b('Setujui Biaya','vb');b('Revisi','rb','ghost')}
 if(p.status_biaya==='Lunas')b('Tanda Terima','tt','ghost');
 return a.join('')}
const tbl=L=>L.length?`<div class="tw"><table><thead><tr><th>No / ID<th>Petugas<th>Maksud & Tujuan<th>Tanggal<th>Estimasi<th>Realisasi<th>Status<th></thead><tbody>${L.map(p=>`<tr><td class="n">${esc(p.no_st||p.id)}<td>${esc(p.nama)}<td>${esc(p.maksud)}<br><small>${esc(p.lokasi)}</small><td class="n">${tgl(p.berangkat)}<br><small>s.d. ${tgl(p.kembali)}</small><td class="n">${rp(p.estimasi)}<td class="n">${p.realisasi?rp(p.realisasi):'-'}${p.bukti?` <a href="${esc(p.bukti)}" target="_blank" rel="noopener" title="Lihat bukti">🔗</a>`:''}<td>${pill(p.status)} ${p.status_biaya?pill(p.status_biaya):''}${p.alasan?`<br><small>${esc(p.alasan)}</small>`:''}<td>${acts(p)}`).join('')}</tbody></table></div>`:'<p class="em">Belum ada data.</p>';
const fl=()=>S.pengajuan.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
const sec={
 dash(){const P=S.pengajuan,n=s=>P.filter(x=>x.status===s).length,R=P.filter(x=>x.realisasi),est=sum(R,'estimasi'),rl=sum(R,'realisasi'),pc=est?Math.min(100,rl/est*100):0;
  return `<h2>Selamat datang, ${esc(S.me.nama)}</h2><div class="grid"><div class="card"><small>MENUNGGU VERIFIKASI</small><b class="big">${n('Diajukan')}</b></div><div class="card"><small>MENUNGGU APPROVAL KADES</small><b class="big">${n('Diverifikasi')}</b></div><div class="card"><small>TOTAL PERJALANAN AKTIF</small><b class="big">${P.filter(x=>x.status!=='Ditolak').length}</b></div><div class="card"><small>REALISASI vs ESTIMASI</small><b class="big">${rp(rl)}</b><div class="bar"><i style="width:${pc}%"></i></div><small>${pc.toFixed(0)}% dari ${rp(est)}</small></div></div><h3>Terbaru</h3>${tbl(P.slice(0,8))}`},
 ajuan:()=>`<h2>Pengajuan SPPD</h2>${tbl(S.pengajuan)}`,
 st:()=>`<h2>Surat Tugas</h2>${tbl(S.pengajuan.filter(x=>x.no_st))}`,
 biaya:()=>`<h2>Biaya & LPJ</h2>${tbl(S.pengajuan.filter(x=>x.status==='Disetujui'))}`,
  tt(){const L=ttList(),n=L.filter(x=>TT.sel.has(x.id)).length,ck='style="width:auto;height:auto"',canL=['Bendahara','Admin'].includes(S.me.role);
  return `<h2>Tanda Terima Pembayaran</h2><div class="card"><div class="fg"><label>Tanggal lunas dari<input type="date" id="tf" value="${TT.from}"></label><label>Sampai tanggal<input type="date" id="tu" value="${TT.to}"></label></div><p class="em">Pilih penerima berstatus <b>Lunas</b>. Daftar Tanda Terima (jumlah, terbilang, tanggal, dan penandatangan) disusun otomatis.</p></div>${L.length?`<div class="tw"><table><thead><tr><th><input type="checkbox" data-a="tta" ${ck}><th>Nama<th>Jabatan<th>NIPD<th>Tgl Lunas Bayar<th>Jumlah</thead><tbody>${L.map(p=>`<tr><td><input type="checkbox" data-tt="${esc(p.id)}" ${TT.sel.has(p.id)?'checked':''} ${ck}><td>${esc(p.nama)}<td>${esc(p.jabatan||'-')}<td class="n">${esc(p.nipd||'-')}<td class="n">${canL?`<input type="date" data-lunas="${esc(p.id)}" value="${esc(p.tgl_lunas||p.kembali)}" style="height:34px;width:150px">`:tgl(p.tgl_lunas||p.kembali)}<td class="n">${rp(p.realisasi)}`).join('')}</tbody></table></div><div class="row"><button class="btn" data-a="ttb" ${n?'':'disabled'}>Buat Tanda Terima (${n} penerima)</button></div>`:'<p class="em">Belum ada pembayaran berstatus Lunas pada rentang ini.</p>'}`},
  laporan(){const L=S.pengajuan.filter(x=>x.status==='Disetujui'),r=S.me.role;
  return `<h2>Laporan Perjalanan</h2>${L.length?`<div class="tw"><table><thead><tr><th>No ST<th>Petugas<th>Maksud & Tujuan<th>Status Laporan<th></thead><tbody>${L.map(p=>{const b=(l,a,c='')=>`<button class="btn sm ${c}" data-a="${a}" data-id="${esc(p.id)}">${l}</button>`,x=[];
   if(r==='Pelaksana'&&(!p.status_laporan||p.status_laporan==='Revisi'))x.push(b('Isi Laporan','lp'));
   if(['Sekretaris','Admin'].includes(r)&&p.status_laporan==='Diajukan')x.push(b('Setujui','ls'),b('Revisi','lr','ghost'));
   if(p.laporan)x.push(b('Lihat','dl','ghost'));
   return `<tr><td class="n">${esc(p.no_st)}<td>${esc(p.nama)}<td>${esc(p.maksud)}<br><small>${esc(p.lokasi)}</small><td>${p.status_laporan?pill(p.status_laporan):'<span class="em">Belum dibuat</span>'}${p.status_laporan==='Revisi'&&p.alasan?`<br><small>${esc(p.alasan)}</small>`:''}<td>${x.join('')}`}).join('')}</tbody></table></div>`:'<p class="em">Belum ada perjalanan yang disetujui.</p>'}`},
 master(){const t=(h,R)=>`<div class="tw"><table style="min-width:0"><thead><tr>${h.map(x=>`<th>${x}`).join('')}</thead><tbody>${R.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}`).join('')}`).join('')}</tbody></table></div>`;
  return `${S.drive?`<div class="card"><b>Penyimpanan Google Drive</b> · <a href="${esc(S.drive.root)}" target="_blank" rel="noopener">📁 Folder Master</a> · <a href="${esc(S.drive.up)}" target="_blank" rel="noopener">📂 Uploads (foto &amp; bukti)</a> · <a href="${esc(S.drive.db)}" target="_blank" rel="noopener">📄 Database Sheet</a></div>`:''}<div class="grid2"><div><h3>Master Aparatur</h3>${t(['NIPD','NIK','Nama','Jabatan','Gol'],(S.aparatur||[]).map(a=>[a.nipd,a.nik,a.nama,a.jabatan,a.golongan]))}</div><div><h3>Pengguna & Peran</h3>${t(['Email','Nama','Peran'],(S.users||[]).map(a=>[a.email,a.nama,a.role]))}</div></div>`},
  arsip:()=>`<h2>Arsip Digital</h2><div class="row" style="margin:0 0 1rem"><input id="q" placeholder="Cari nama, tujuan, status..." value="${esc(q)}"><button class="btn ghost" data-a="csv">Ekspor CSV</button></div><div id="ta">${tbl(fl())}</div>`,
 stat(){const P=S.pengajuan,by=f=>P.reduce((m,x)=>{const k=f(x)||'-';m[k]=(m[k]||0)+1;return m},{}),bars=o=>{const mx=Math.max(1,...Object.values(o));return Object.entries(o).sort().map(([k,v])=>`<div class="br"><span>${esc(k)}</span><div class="bar"><i style="width:${v/mx*100}%"></i></div><b>${v}</b></div>`).join('')||'<p class="em">Belum ada data.</p>'};
  return `<h2>Analitik</h2><div class="grid2"><div class="card"><h3>Status Pengajuan</h3>${bars(by(x=>x.status))}</div><div class="card"><h3>Perjalanan per Bulan</h3>${bars(by(x=>(x.berangkat||'').slice(0,7)))}</div><div class="card"><h3>Per Petugas</h3>${bars(by(x=>x.nama))}</div></div>`}};
const bdg=k=>{const r=S.me.role,P=S.pengajuan,c=k==='ajuan'?(['Sekretaris','Admin'].includes(r)?P.filter(x=>x.status==='Diajukan').length:r==='Kepala Desa'?P.filter(x=>x.status==='Diverifikasi').length:0):k==='biaya'&&r==='Bendahara'?P.filter(x=>x.status_biaya==='Diajukan').length:0;return c?`<span class="bdg">${c}</span>`:''};
function draw(){let vb=$('ver');if(!vb){vb=document.createElement('div');vb.id='ver';vb.className='warn';$('main').prepend(vb)}vb.hidden=(S.v||0)>=10;vb.textContent='⚠ Backend (Kode.gs) belum versi terbaru — daftar pengikut, rincian biaya, dan tanggal lunas belum aktif. Paste Kode.gs terbaru lalu Deploy → Manage deployments → Edit → New version.';const pb=$('pkb');if(pb){const k=(S.aparatur||[]).map(a=>a.nama).join('|');if(pb.dataset.k!==k){pb.dataset.k=k;pb.innerHTML=pkBox()}}
 const al=ROLE[S.me.role].split(' ');if(!al.includes(cur))cur=al[0];
 $('meN').textContent=S.me.nama;$('meR').textContent=S.me.role;
 let g='';$('nav').innerHTML=al.map(k=>{const h=GRP[k]!==g?`<div class="gh">${g=GRP[k]}</div>`:'';return h+`<a data-g="${k}">${ICO[k]} ${SECS[k]}${bdg(k)}</a>`}).join('');
 al.forEach(k=>$('c-'+k).innerHTML=sec[k]());show()}
function show(){document.querySelectorAll('.sec').forEach(s=>s.classList.toggle('on',s.id==='s-'+cur));document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.g===cur));$('ttl').textContent=SECS[cur]}
const go=k=>{cur=k;show();$('side').classList.remove('open')};  // navigasi SPA 0ms
const pkBox=()=>{const L=(S.aparatur||[]).filter(a=>a.email!==S.me.email);return L.length?`<div class="chk"><b>Pengikut dari daftar aparatur:</b>${L.map(a=>`<label class="ck"><input type="checkbox" name="pk" value="${esc(a.nama)}">${esc(a.nama)}</label>`).join('')}</div>`:'<p class="em sm">Daftar aparatur belum termuat. Isi Master Data, atau pastikan backend sudah diperbarui (Deploy → New version).</p>'};
const fm=()=>['Pelaksana','Admin'].includes(S.me.role)?`<form id="fm" class="card"><h3>Pengajuan Baru</h3><div class="fg"><label>Maksud / Tujuan Kegiatan<input name="maksud" required></label><label>Lokasi Tujuan<input name="lokasi" required></label><label>Jarak pergi-pulang (km)<input name="jarak_km" type="number" min="0" required></label><label>Dasar (Surat / Undangan)<input name="dasar" required></label><label>Waktu (jam)<input name="waktu" placeholder="08.00 WIB s.d. selesai"></label><label>Mata Anggaran<input name="mata_anggaran" placeholder="mis. 5.1.2.01.02"></label><label>Pengikut lain (isi manual bila tidak ada di daftar; pisahkan koma)<input name="pengikut"></label><label>Berangkat<input name="berangkat" type="date" required></label><label>Kembali<input name="kembali" type="date" required></label></div><div id="pkb"></div><p id="est" class="est"></p><button class="btn">Ajukan</button></form>`:'';
function est(){const f=$('fm');if(!f)return;const v=Object.fromEntries(new FormData(f)),d=days(v.berangkat,v.kembali),c=1+f.querySelectorAll('[name=pk]:checked').length+String(v.pengikut||'').split(/[,;]/).filter(x=>x.trim()).length;$('est').textContent=d>=1?`Estimasi: ${c} orang × ${d} hari × ${rp(S.biaya.uang_harian)} + ${v.jarak_km||0} km × ${rp(S.biaya.transport_km)} = ${rp(c*d*S.biaya.uang_harian+(+v.jarak_km||0)*S.biaya.transport_km)}`:''}

// ---- Dokumen cetak (Ctrl+P → Simpan sebagai PDF) ----
const doc=h=>{$('dlg').innerHTML=h+'<div class="row noprint"><button class="btn" data-a="pr">Cetak / Simpan PDF</button><button class="btn ghost" data-a="x">Tutup</button></div>';$('dlg').showModal()};
const formLunas=p=>{$('dlg').innerHTML=`<h3>Setujui Biaya — ${esc(p.id)}</h3><p>${esc(p.nama)} · Realisasi <b>${rp(p.realisasi)}</b></p><label>Tanggal Lunas Bayar<input type="date" id="tl" value="${esc(p.kembali)}"></label><p class="em">Bawaan: sama dengan tanggal terbit surat (tanggal kembali). Ubah bila pembayaran dilakukan pada tanggal lain.</p><div class="row"><button class="btn" data-a="vbs" data-id="${esc(p.id)}">Setujui &amp; Lunas</button><button class="btn ghost" data-a="x">Batal</button></div>`;$('dlg').showModal()};
const biFields=p=>{const N=[p.nama,...pkList(p)];return N.length>1?N.map(n=>`<label>${esc(n)} (Rp)<input class="rc" type="number" min="0" value="${Math.round(p.estimasi/N.length)}"></label>`).join('')+'<p>Total: <b id="rsum">${rp(Math.round(p.estimasi/N.length)*N.length)}</b></p>':'<label>Total realisasi (Rp)<input id="rt" type="number" min="1"></label>'};
function formBiaya(p){$('dlg').innerHTML=`<h3>Realisasi Biaya — ${esc(p.id)}</h3><p>Estimasi ${rp(p.estimasi)} · batas maksimum 110% = <b>${rp(p.estimasi*1.1)}</b></p>${biFields(p)}<label>Upload bukti (foto/scan kuitansi — JPG/PNG/PDF)<input type="file" accept="image/*,application/pdf" data-up="${esc(p.id)}|bukti|rbk|"></label><label>Link bukti (terisi otomatis setelah upload)<input id="rbk"></label><div class="row"><button class="btn" data-a="sv" data-id="${esc(p.id)}">Kirim</button><button class="btn ghost" data-a="x">Batal</button></div>`;$('dlg').showModal()}

const mf=()=>`<h2>Master Data</h2><div class="grid2"><form id="fa" class="card"><h3>Tambah Aparatur</h3><label>NIPD<input name="nipd" required></label><label>NIK<input name="nik"></label><label>Nama<input name="nama" required></label><label>Jabatan<input name="jabatan"></label><label>Golongan<input name="golongan"></label><label>Email akun terkait<input name="email" type="email"></label><button class="btn">Simpan</button></form><form id="fu" class="card"><h3>Tambah Pengguna</h3><label>Email<input name="email" type="email" required></label><label>Nama<input name="nama" required></label><label>Peran<select name="role">${Object.keys(ROLE).map(r=>`<option>${r}</option>`).join('')}</select></label><label>PIN awal (min 4)<input name="pin" type="password" minlength="4" required></label><button class="btn">Simpan</button></form></div>`;
function formLap(p){const L=p.laporan?JSON.parse(p.laporan):{};
 $('dlg').innerHTML=`<h3>Laporan Perjalanan — ${esc(p.no_st)}</h3><label>Poin hasil kegiatan (1 baris = 1 poin)<textarea id="lh" placeholder="Contoh: Pagu bantuan keuangan disetujui Rp 250.000.000"></textarea></label><button class="btn ghost sm" id="aib" data-a="ai" data-id="${esc(p.id)}">✨ Generate Draft (AI)</button><label>I. Maksud Perjalanan Dinas<textarea id="lm">${esc(L.maksud||p.maksud)}</textarea></label><label>II. Tujuan Perjalanan Dinas<textarea id="lt">${esc(L.tujuan||p.maksud)}</textarea></label><label>IV. Hasil / Kesimpulan<textarea id="lw">${esc(L.hasil||'')}</textarea></label><label>Catatan tindak lanjut (internal, tidak dicetak)<textarea id="ll">${esc(L.tindak||'')}</textarea></label>${[1,2].map(i=>`<label>Foto ${i} — keterangan<input id="k${i}" value="${esc(L['k'+i])}"></label><label>Foto ${i} — upload (JPG/PNG)<input type="file" accept="image/*" data-up="${esc(p.id)}|foto${i}|f${i}|pv${i}"></label><input id="f${i}" type="hidden" value="${esc(L['f'+i])}"><img id="pv${i}" class="pv" ${L['f'+i]?`src="${esc(IMG(L['f'+i]))}"`:'hidden'} alt="">`).join('')}<div class="row"><button class="btn" data-a="sl" data-id="${esc(p.id)}">Kirim Laporan</button><button class="btn ghost" data-a="x">Batal</button></div>`;$('dlg').showModal()}
async function aiGen(p){const poin=$('lh').value.trim();if(!poin)return toast('Isi poin hasil kegiatan dulu',1);const b=$('aib');b.disabled=true;b.textContent='Menyusun...';
 const j=v=>Array.isArray(v)?v.join('\n'):v;
 let h=poin.split('\n').filter(x=>x.trim()).map((x,i)=>`${i+1}. ${x.trim().replace(/^[-\d.\s]+/,'')}`).join('\n'),t='1. Menindaklanjuti hasil kegiatan dalam rapat koordinasi internal pemerintah desa.\n2. Menyampaikan laporan kepada Kepala Desa untuk arahan lebih lanjut.';
 try{const r=await api({token:tok,action:'ai',id:p.id,poin});if(r.success){h=j(r.hasil);t=j(r.tindak)}else toast(r.message||'Memakai template lokal')}catch(e){toast('Offline: memakai template lokal')}
 $('lw').value=h;$('ll').value=t;b.disabled=false;b.textContent='✨ Generate Draft (AI)'}
const TT={sel:new Set(),from:'',to:''},ttList=()=>S.pengajuan.filter(x=>x.status_biaya==='Lunas'&&(!TT.from||(x.tgl_lunas||x.kembali)>=TT.from)&&(!TT.to||(x.tgl_lunas||x.kembali)<=TT.to));
// ---- Upload ke Google Drive (gambar dikompres di perangkat dulu) ----
const rd=(f,ok,no)=>{const r=new FileReader;r.onload=()=>ok({mime:f.type,data:r.result.split(',')[1],name:f.name});r.onerror=()=>no(Error('Gagal membaca file'));r.readAsDataURL(f)};
const shrink=f=>new Promise((ok,no)=>{if(!f.type.startsWith('image/'))return f.size>1.5e6?no(Error('PDF maksimal 1,5 MB')):rd(f,ok,no);const i=new Image;i.onload=()=>{const s=Math.min(1,1400/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok({mime:'image/jpeg',data:c.toDataURL('image/jpeg',.72).split(',')[1],name:f.name.replace(/\.\w+$/,'')+'.jpg'})};i.onerror=()=>no(Error('File gambar tidak valid'));i.src=URL.createObjectURL(f)});
async function upl(inp,id,kind,tid,pid){const f=inp.files[0];if(!f)return;toast('Mengunggah ke Google Drive...');inp.disabled=true;
 try{const x=await shrink(f),r=await api({token:tok,action:'upload',id,kind,name:x.name,mime:x.mime,data:x.data});if(!r.success)throw Error(r.message);
  $(tid).value=r.url;if(pid){$(pid).src=IMG(r.url);$(pid).hidden=false}
  toast(r.shared?'Tersimpan di Google Drive ✔':'Tersimpan, tetapi folder tidak bisa dibagikan publik — foto mungkin tidak tampil di cetak',!r.shared)}
 catch(e){toast('Upload gagal: '+e.message,1);inp.value=''}inp.disabled=false}
document.addEventListener('change',e=>{const t=e.target,u=t.dataset&&t.dataset.up;if(u){const[id,kind,tid,pid]=u.split('|');upl(t,id,kind,tid,pid)}
 if(t.dataset&&t.dataset.tt){t.checked?TT.sel.add(t.dataset.tt):TT.sel.delete(t.dataset.tt);$('c-tt').innerHTML=sec.tt()}
 if(t.dataset&&t.dataset.lunas&&t.value)act({action:'setLunas',id:t.dataset.lunas,tgl:t.value},'Tanggal lunas disimpan ✔');
 if(t.id==='tf'||t.id==='tu'){TT[t.id==='tf'?'from':'to']=t.value;$('c-tt').innerHTML=sec.tt()}});
// ---- Event delegation ----
document.addEventListener('click',e=>{const t=e.target.closest('[data-a],[data-g]');if(!t)return;if(t.dataset.g)return go(t.dataset.g);
 const id=t.dataset.id,a=t.dataset.a,p=S.pengajuan.find(x=>x.id===id),ask=(m,f)=>{const x=prompt(m);if(x&&x.trim())f(x.trim())};
 if(a==='v')act({action:'putuskan',id,aksi:'setuju'},'Disetujui ✔');
 else if(a==='t')ask('Alasan penolakan:',x=>act({action:'putuskan',id,aksi:'tolak',alasan:x},'Ditolak'));
 else if(a==='st')docST(p);else if(a==='sp')docSPD(p);else if(a==='tt')docTT(p);else if(a==='bi')formBiaya(p);
 else if(a==='vb')formLunas(p);else if(a==='vbs'){act({action:'verifBiaya',id,aksi:'setuju',tgl:$('tl').value},'Biaya disetujui ✔');$('dlg').close()}
 else if(a==='rb')ask('Alasan revisi:',x=>act({action:'verifBiaya',id,aksi:'revisi',alasan:x},'Revisi diminta'));
 else if(a==='sv'){const rc=[...document.querySelectorAll('.rc')].map(i=>+i.value||0),total=rc.length?rc.reduce((a,b)=>a+b,0):+$('rt').value,bukti=$('rbk').value.trim();if(!(total>0)||!bukti)return toast('Total & link bukti wajib diisi',1);if(total>p.estimasi*1.1)toast('Peringatan: melebihi 110% estimasi',1);$('dlg').close();act({action:'realisasi',id,total,bukti,rincian:rc.length?rc:undefined},'Realisasi dikirim ✔')}
 else if(a==='lp')formLap(p);else if(a==='dl')docLap(p);else if(a==='ai')aiGen(p);
 else if(a==='ls')act({action:'putuskanLaporan',id,aksi:'setuju'},'Laporan dikonfirmasi ✔');
 else if(a==='lr')ask('Catatan revisi:',x=>act({action:'putuskanLaporan',id,aksi:'revisi',alasan:x},'Revisi diminta'));
 else if(a==='sl'){const L={maksud:$('lm').value,tujuan:$('lt').value,hasil:$('lw').value.trim(),tindak:$('ll').value,k1:$('k1').value,f1:$('f1').value,k2:$('k2').value,f2:$('f2').value};if(!L.hasil)return toast('Hasil kegiatan wajib diisi',1);$('dlg').close();act({action:'laporan',id,laporan:L},'Laporan dikirim ✔')}
 else if(a==='tta'){const L=ttList(),all=L.every(x=>TT.sel.has(x.id));L.forEach(x=>all?TT.sel.delete(x.id):TT.sel.add(x.id));$('c-tt').innerHTML=sec.tt()}else if(a==='ttb')docTTD(ttList().filter(x=>TT.sel.has(x.id)));else if(a==='x')$('dlg').close();else if(a==='pr'){$('pr').innerHTML=[...$('dlg').querySelectorAll('.pg')].map(x=>x.outerHTML).join('');setTimeout(print,50)}
 else if(a==='csv'){const L=fl(),k=Object.keys(L[0]||{}),c=v=>'"'+String(v??'').replace(/"/g,'""')+'"',b=new Blob(['\ufeff'+[k.map(c).join(',')].concat(L.map(r=>k.map(x=>c(r[x])).join(','))).join('\n')],{type:'text/csv'}),l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='arsip-sppd.csv';l.click()}});
document.addEventListener('input',e=>{if(e.target.classList.contains('rc'))$('rsum').textContent=rp([...document.querySelectorAll('.rc')].reduce((a,i)=>a+(+i.value||0),0));if(e.target.closest('#fm')){est();localStorage.setItem('draft',JSON.stringify(Object.fromEntries(new FormData($('fm')))))}
 else if(e.target.id==='q'){clearTimeout(qt);qt=setTimeout(()=>{q=e.target.value;$('ta').innerHTML=tbl(fl())},200)}});  // debounce + filter lokal
document.addEventListener('submit',e=>{const fid=e.target.id;
 if(fid==='fa'||fid==='fu'){e.preventDefault();const rec=Object.fromEntries(new FormData(e.target)),t=fid==='fa'?'aparatur':'user';S.aparatur=S.aparatur||[];S.users=S.users||[];t==='aparatur'?S.aparatur.push(rec):S.users.push({email:rec.email,nama:rec.nama,role:rec.role});act({action:'master',tab:t,rec},'Tersimpan ✔');e.target.reset();return}
 if(fid!=='fm')return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target));
 if(days(v.berangkat,v.kembali)<1)return toast('Tanggal kembali tidak boleh sebelum berangkat',1);
 v.jarak_km=+v.jarak_km;v.pengikut=[...new FormData(e.target).getAll('pk'),...String(v.pengikut||'').split(/[,;]/)].map(s=>s.trim()).filter(Boolean).join(', ');delete v.pk;act({action:'ajukan',tmp:'TMP-'+Date.now(),...v},'Pengajuan terkirim ✔');e.target.reset();localStorage.removeItem('draft');est()});
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
