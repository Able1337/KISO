"""Reviewed archive layouts; geometry is measured on original scans, not OCR text."""
import numpy as np
from PIL import Image

TABLES={2024:{24,46,49,57,60,65,75,85},2025:{30,37,39,45,62,69,71,72,73,83}}
GRIDS={2024:{4:(76.8,334.8,2),22:(76,275.2,2),27:(76.8,295.2,4),28:(76.8,615.6,4),30:(77.2,375.2,4),33:(76.8,414.4,4),38:(76.4,605.6,4),39:(77.6,254.8,4),42:(76.4,521.6,4),53:(76,453.2,4),58:(76,615.6,2),63:(76,574.8,2),67:(77.2,571.6,4),68:(78,154.8,2),69:(77.6,314.8,4),72:(77.2,300.8,4),84:(77.6,518.4,2),93:(76.8,333.2,4),94:(76.8,553.6,2),97:(76.8,175.6,4)},2025:{}}
GRIDS[2024].update({43:(77.2,234,4),78:(76.4,434,4),83:(77.2,361,4),95:(77.2,134.8,2),96:(77.2,454.8,4),99:(76.4,515.2,2)})
CUSTOM={2024:{81:[(77.2,313.2),(77.2,389.6),(77.2,466.4),(77.2,543.2)]},2025:{}}
CUSTOM[2024].update({17:[(76,433.6),(76,474),(76,514),(75.6,554)],66:[(78,134),(78,174),(78,214),(77.2,254)]})
CUSTOM[2024][97]=[(76.8,175.6),(173.2,175.6),(278,175.6),(362,175.6)]
CUSTOM[2025].update({47:[(73.2,162.8),(73.2,183.2),(73.2,203.2),(72.4,222.8)],50:[(72,365.2),(72,385.2),(72,425.2),(71.2,445.2)],79:[(70.8,586),(70.8,606),(70.8,626),(70,645.6)]})
GRIDS[2024].update({23:(75.2,515.2,4),76:(77.2,640.4,4),79:(78,151.6,2),80:(76.8,375.2,4),100:(77.2,194.4,2)})
GRIDS[2025].update({10:(73.2,145.2,2),21:(71.6,345.2,2),48:(70.4,424,4)})
GRIDS[2025].update({1:(72,336.4,4),2:(71.2,476.4,2),4:(72.4,344.8,4),16:(73.2,225.6,4),23:(72.8,205.2,4),26:(71.2,621.2,4),34:(70.4,606.4,4),35:(73.2,142.4,2),41:(71.2,464.4,4),42:(70.4,584.8,2),44:(71.6,425.6,2),46:(71.2,587.2,2),54:(71.2,370.4,4),55:(72.4,305.6,4),65:(70.4,484,2),70:(73.2,145.2,2),75:(72.8,265.6,4),76:(71.2,573.2,2),77:(74,146.4,2),78:(72,484,4),81:(72,306.4,4),82:(70.8,426.4,2),85:(72,185.2,4),86:(70.4,305.2,2),89:(69.6,520.8,4),94:(72,547.2,4),96:(70.4,386,4),97:(69.2,582.8,4),98:(70.4,325.6,4),99:(69.2,583.6,4)})

def table_rows(image,top,bottom):
    arr=np.asarray(image.convert('L'))
    candidates=[]
    for y in range(round(top*2.5),min(round(bottom*2.5),arr.shape[0])):
        row=arr[y]<150
        changes=np.diff(np.r_[False,row,False].astype(int))
        starts=np.flatnonzero(changes==1);ends=np.flatnonzero(changes==-1)
        spans=[(int(a),int(b)) for a,b in zip(starts,ends) if b-a>180]
        if spans:candidates.append((y,min(a for a,b in spans),max(b for a,b in spans)))
    groups=[]
    for y,x0,x1 in candidates:
        if groups and y-groups[-1][-1][0]<=4:groups[-1].append((y,x0,x1))
        else:groups.append([(y,x0,x1)])
    lines=[(sum(a[0] for a in g)/len(g)/2.5,min(a[1] for a in g)/2.5,max(a[2] for a in g)/2.5) for g in groups]
    return lines[-6:]

def layout(year,number,image,top,bottom):
    if number in CUSTOM[year]:return CUSTOM[year][number],None
    if number in TABLES[year]:
        lines=table_rows(image,top,bottom)
        assert len(lines)==6,(year,number,lines)
        ys=[l[0] for l in lines]
        assert all(15<b-a<40 for a,b in zip(ys,ys[1:])),(year,number,lines)
        # Header excludes the source-letter column; repeat it above each row.
        left=lines[0][1];right=max(l[2] for l in lines)
        return None,(left,right,ys)
    if number in GRIDS[year]:
        x,y,columns=GRIDS[year][number]
        step=(190 if columns==2 else 95) if year==2025 else (191 if columns==2 else 96)
        return [(x+step*(i%columns),y+20*(i//columns)) for i in range(4)],None
    return None,None
