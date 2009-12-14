"""
XTEA Block Encryption Algorithm
Author: Paul Chakravarti (paul_dot_chakravarti_at_gmail_dot_com)
License: Public Domain
""" 

def encrypt(data, encryption_key = '1234567890123456'):
	return crypt(encryption_key, data).encode('hex')

def decrypt(data, encryption_key = '1234567890123456'):
	return crypt(encryption_key, data.decode('hex'))

def crypt(key,data,iv='\00\00\00\00\00\00\00\00',n=32):
	def keygen(key,iv,n):
		while True:
			iv = xtea_encrypt(key,iv,n)
			for k in iv:
				yield ord(k)
	xor = [ chr(x^y) for (x,y) in zip(map(ord,data),keygen(key,iv,n)) ]
	return "".join(xor)

def xtea_encrypt(key,block,n=32,endian="!"):
	import struct
	v0,v1 = struct.unpack(endian+"2L",block)
	k = struct.unpack(endian+"4L",key)
	sum,delta,mask = 0L,0x9e3779b9L,0xffffffffL
	for round in range(n):
		v0 = (v0 + (((v1<<4 ^ v1>>5) + v1) ^ (sum + k[sum & 3]))) & mask
		sum = (sum + delta) & mask
		v1 = (v1 + (((v0<<4 ^ v0>>5) + v0) ^ (sum + k[sum>>11 & 3]))) & mask
	return struct.pack(endian+"2L",v0,v1)
	
def xtea_decrypt(key,block,n=32,endian="!"):
	import struct

	v0,v1 = struct.unpack(endian+"2L",block)
	k = struct.unpack(endian+"4L",key)
	delta,mask = 0x9e3779b9L,0xffffffffL
	sum = (delta * n) & mask
	for round in range(n):
		v1 = (v1 - (((v0<<4 ^ v0>>5) + v0) ^ (sum + k[sum>>11 & 3]))) & mask
		sum = (sum - delta) & mask
		v0 = (v0 - (((v1<<4 ^ v1>>5) + v1) ^ (sum + k[sum & 3]))) & mask
	return struct.pack(endian+"2L",v0,v1)

